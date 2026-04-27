/**
 * On-Chain State Service
 *
 * Derives application state directly from the BSV blockchain by querying OP_RETURN data.
 * This is the source of truth for wallet identity, programs, and punch card progress.
 *
 * nTangleMint OP_RETURN formats (null-byte separated fields, extensible design):
 *
 *   WALLET:   nTangleMint | WALLET | {walletID} | reserved...
 *   PROGRAM:  nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved...
 *   nTangled: nTangleMint | nTangled | {programID} | {customerWalletID} | reserved...
 *   nProcess: nTangleMint | nProcess | {programID} | {customerWalletID} | reserved...
 *   Redeemed: nTangleMint | Redeemed | {programID} | {customerWalletID} | reserved...
 *   DELETE:   nTangleMint | DELETE | {programID} | {walletID} | reserved...
 *
 * No versioning - design is extensible. Reserved fields allow future additions without breaking backward compatibility.
 * All external API calls route through server-side handlers (/api/external/*) to bypass CORS.
 */

import cacheService, {
  getCacheKeyWallet,
  getCacheKeyPunchCard,
  CACHE_TTL,
} from "./cache-service"

// ============================================================================
// Interfaces
// ============================================================================

export interface WalletMetadata {
  walletID: string
  txId: string
  timestamp: number
}

export interface OnChainPunchCard {
  programId: string
  walletID: string
  customerAddress: string
  punchIndex: number
  txId: string
  blockHeight?: number
  timestamp: number
}

export interface ProgramParticipants {
  programId: string
  uniqueCustomers: Set<string>
  totalTransactions: number
  transactions: OnChainPunchCard[]
}

export interface OnChainProgram {
  programId: string
  walletID: string
  creatorAddress: string
  programName?: string
  reward?: string
  requiredPunches?: number
  expirationDays?: number
  txId: string
  blockHeight?: number
  timestamp: number
}

export interface CustomerProgramState {
  programId: string
  customerAddress: string
  punches: number
  txIds: string[]
  lastUpdated: number
}

// ============================================================================
// Cache (managed by cache-service.ts)
// ============================================================================

// ============================================================================
// OP_RETURN Parsing Utilities
// ============================================================================

/**
 * Parse OP_RETURN script hex into string fields.
 * BSV OP_RETURN format: 6a <pushdata opcode> <data> ...
 */
function parseOpReturnFields(scriptHex: string): string[] {
  if (!scriptHex || !scriptHex.startsWith("6a")) return []

  try {
    const scriptBuffer = Buffer.from(scriptHex, "hex")
    let pos = 1 // Skip OP_RETURN opcode (0x6a)
    const fields: string[] = []

    while (pos < scriptBuffer.length) {
      const byte = scriptBuffer[pos]

      if (byte <= 0x4b) {
        // Direct push (length 1-75 bytes)
        const len = byte
        pos += 1
        if (pos + len <= scriptBuffer.length) {
          const field = scriptBuffer.subarray(pos, pos + len).toString("utf-8")
          // Split field on null bytes to handle nTangleMint format (nTangleMint | FIELD | v1 | ...)
          const subfields = field.split("\x00")
          fields.push(...subfields)
          pos += len
        } else {
          break
        }
      } else if (byte === 0x4c) {
        // OP_PUSHDATA1
        pos += 1
        const len = scriptBuffer[pos]
        pos += 1
        if (pos + len <= scriptBuffer.length) {
          const field = scriptBuffer.subarray(pos, pos + len).toString("utf-8")
          // Split field on null bytes to handle nTangleMint format
          const subfields = field.split("\x00")
          fields.push(...subfields)
          pos += len
        } else {
          break
        }
      } else {
        // Unknown opcode, stop parsing
        break
      }
    }

    return fields
  } catch {
    return []
  }
}

// ============================================================================
// Wallet Metadata
// ============================================================================

/**
 * Query wallet metadata from blockchain.
 *
 * Parses WALLET OP_RETURN: nTangleMint | WALLET | v1 | {walletID} | reserved1-10
 *
 * Returns null if:
 *   - No WALLET record found for this address
 *   - Network error (throws only on non-recoverable errors)
 */
async function queryWalletMetadata(walletAddress: string): Promise<WalletMetadata | null> {
  const cacheKey = getCacheKeyWallet(walletAddress)

  // Check cache first
  const cached = cacheService.get<WalletMetadata | null>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const url = `/api/external/onchain-state?type=WALLET&address=${encodeURIComponent(walletAddress)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      cacheService.set(cacheKey, null, CACHE_TTL.WALLET)
      return null
    }

    const data = await response.json()
    const results = data.transactions || []

    if (!Array.isArray(results) || results.length === 0) {
      cacheService.set(cacheKey, null, CACHE_TTL.WALLET)
      return null
    }

    // Parse each transaction looking for WALLET record
    for (const result of results) {
      if (!result.vout || !Array.isArray(result.vout)) continue

      for (const output of result.vout) {
        const scriptHex = output.scriptPubKey?.hex
        const fields = parseOpReturnFields(scriptHex)

        // WALLET format: nTangleMint | WALLET | v1 | {walletID} | reserved1-10
        if (
          fields.length >= 4 &&
          fields[0] === "nTangleMint" &&
          fields[1] === "WALLET"
        ) {
          const walletID = fields[3]?.trim()

          // Validate walletID format (wid_{12-char-base36})
          if (!/^wid_[0-9a-z]{12}$/.test(walletID)) continue

          const metadata: WalletMetadata = {
            walletID,
            txId: result.txid,
            timestamp: result.time || Date.now(),
          }

          cacheService.set(cacheKey, metadata, CACHE_TTL.WALLET)
          return metadata
        }
      }
    }

    // No valid WALLET record found
    cacheService.set(cacheKey, null, CACHE_TTL.WALLET)
    return null
  } catch (error) {
    // Network error - cache null to avoid repeated failures
    cacheService.set(cacheKey, null, CACHE_TTL.WALLET)
    return null
  }
}

/**
 * Get wallet metadata from on-chain.
 * Used by wallet restoration to retrieve walletID (if available).
 * If not found, restoration still succeeds with a generated walletID.
 */
export async function getWalletMetadataOnChain(walletAddress: string): Promise<WalletMetadata | null> {
  return queryWalletMetadata(walletAddress)
}

/**
 * Invalidate wallet metadata cache.
 * Call after broadcasting a new WALLET record.
 */
export function invalidateWalletMetadataCache(walletAddress: string): void {
  const cacheKey = getCacheKeyWallet(walletAddress)
  cacheService.clearByPattern(cacheKey)
}

// ============================================================================
// Program Recovery
// ============================================================================

/**
 * Query PROGRAM records from blockchain by wallet address.
 * 
 * Parses PROGRAM OP_RETURN formats:
 * Old format (v1): nTangleMint | PROGRAM | {programID} | {walletID} | reserved...
 * New format: nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved...
 * 
 * Returns programs created by the wallet with the given address, including recovered details if available.
 */
export async function getProgramsByWalletOnChain(walletAddress: string): Promise<OnChainProgram[]> {
  const cacheKey = `programs:wallet:${walletAddress}`
  
  // Check cache first
  const cached = cacheService.get<OnChainProgram[]>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const url = `/api/external/onchain-state?type=PROGRAM&address=${encodeURIComponent(walletAddress)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    const data = await response.json()
    const results = data.transactions || []

    if (!Array.isArray(results) || results.length === 0) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    const programs: OnChainProgram[] = []

    // Parse each transaction looking for PROGRAM records
    for (const result of results) {
      if (!result.vout || !Array.isArray(result.vout)) continue

      for (const output of result.vout) {
        const scriptHex = output.scriptPubKey?.hex
        if (!scriptHex) continue
        
        const fields = parseOpReturnFields(scriptHex)

        // Check minimum fields for any PROGRAM format
        if (fields.length >= 4 && fields[0] === "nTangleMint" && fields[1] === "PROGRAM") {
          const programId = fields[2]?.trim()
          const walletID = fields[3]?.trim()

          // Validate programID format (pid_{12-char-base36})
          if (!/^pid_[0-9a-z]{12}$/.test(programId)) continue
          // Validate walletID format (wid_{12-char-base36})
          if (!/^wid_[0-9a-z]{12}$/.test(walletID)) continue

          // Extract optional recovery fields (new format)
          let programName: string | undefined
          let reward: string | undefined
          let requiredPunches: number | undefined
          let expirationDays: number | undefined

          if (fields.length >= 8) {
            // New format includes program details
            try {
              programName = fields[4] ? decodeURIComponent(fields[4]) : undefined
              reward = fields[5] ? decodeURIComponent(fields[5]) : undefined
              requiredPunches = fields[6] ? parseInt(fields[6], 10) : undefined
              expirationDays = fields[7] ? parseInt(fields[7], 10) : undefined
            } catch (e) {
              // URL decoding failed, use undefined
            }
          }

          programs.push({
            programId,
            walletID,
            creatorAddress: walletAddress,
            programName,
            reward,
            requiredPunches,
            expirationDays,
            txId: result.txid,
            blockHeight: result.blockheight,
            timestamp: result.time || Date.now(),
          })
        }
      }
    }

    cacheService.set(cacheKey, programs, CACHE_TTL.WALLET)
    return programs
  } catch (error) {
    cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
    return []
  }
}

/**
 * Invalidate programs cache for a wallet.
 * Call after broadcasting a new PROGRAM record.
 */
export function invalidateProgramsCache(walletAddress: string): void {
  cacheService.clearByPattern(`programs:wallet:${walletAddress}`)
}

// ============================================================================
// Punch Card / nTangle Transactions
// ============================================================================

/**
 * Parse nTangle/nProcess/Redeemed transaction.
 * Format: nTangleMint | {type} | {programID} | {walletID}
 */
function parseNTangleTransaction(
  txData: any,
  filterProgramId?: string
): OnChainPunchCard | null {
  try {
    if (!txData.txid) return null

    const programId = txData.data?.[2] || filterProgramId
    const customerAddress = txData.data?.[3] || txData.from
    const punchIndex = parseInt(txData.data?.[4] || "1", 10)

    if (!programId || !customerAddress) return null

    return {
      programId,
      walletID: "", // Will be populated when we have full OP_RETURN parsing
      customerAddress,
      punchIndex,
      txId: txData.txid,
      blockHeight: txData.height,
      timestamp: txData.time || Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * Query on-chain for nTangle/nProcess/Redeemed transactions.
 */
async function queryOnChainTransactions(programId?: string): Promise<OnChainPunchCard[]> {
  const cacheKey = getCacheKeyPunchCard(programId || "all", "")

  const cached = cacheService.get<OnChainPunchCard[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const url = `/api/external/onchain-state?type=nTangled${programId ? `&address=${encodeURIComponent(programId)}` : ""}`

    const response = await fetch(url)
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const results = data.transactions || []

    if (!Array.isArray(results)) {
      return []
    }

    const transactions: OnChainPunchCard[] = []

    for (const result of results) {
      const parsed = parseNTangleTransaction(result, programId)
      if (parsed) {
        transactions.push(parsed)
      }
    }

    cacheService.set(cacheKey, transactions, CACHE_TTL.CONFIRMED)
    return transactions
  } catch {
    return []
  }
}

/**
 * Get all participants for a program from on-chain data.
 */
export async function getProgramParticipantsOnChain(programId: string): Promise<ProgramParticipants> {
  const transactions = await queryOnChainTransactions(programId)
  const programTxs = transactions.filter((tx) => tx.programId === programId)
  const uniqueCustomers = new Set(programTxs.map((tx) => tx.customerAddress))

  return {
    programId,
    uniqueCustomers,
    totalTransactions: programTxs.length,
    transactions: programTxs,
  }
}

/**
 * Get punch card state for a specific customer in a specific program.
 */
export async function getCustomerProgramStateOnChain(
  programId: string,
  customerAddress: string
): Promise<CustomerProgramState> {
  const transactions = await queryOnChainTransactions(programId)

  const customerTxs = transactions.filter(
    (tx) => tx.programId === programId && tx.customerAddress === customerAddress
  )

  return {
    programId,
    customerAddress,
    punches: customerTxs.length,
    txIds: customerTxs.map((tx) => tx.txId),
    lastUpdated: Date.now(),
  }
}

/**
 * Get participant count for a program.
 * Falls back to local storage if blockchain query fails.
 */
export async function getParticipantCountOnChain(programId: string): Promise<number> {
  try {
    const participants = await getProgramParticipantsOnChain(programId)
    const count = participants.uniqueCustomers.size
    if (count > 0) {
      return count
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: count from local storage
  try {
    const { getAllPunchCards } = await import("./storage-service")
    const allCards = getAllPunchCards()
    const programCards = allCards.filter((card: any) => card.programId === programId && card.punches > 0)
    const uniqueCustomers = new Set(programCards.map((card: any) => card.customerAddress))
    return uniqueCustomers.size
  } catch {
    return 0
  }
}

/**
 * Invalidate on-chain cache for a program.
 * Call after broadcasting a new transaction.
 */
export function invalidateOnChainCache(programId?: string): void {
  if (programId) {
    cacheService.clearByPattern(`punchcard:${programId}`)
    cacheService.clearByPattern("punchcard:all")
  } else {
    cacheService.clearAll()
  }
}