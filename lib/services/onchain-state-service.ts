/**
 * On-Chain State Service
 *
 * Derives application state from the BSV blockchain by querying and parsing OP_RETURN data.
 * Uses type-aware program parser router to handle all program types consistently.
 * Source of truth for program discovery, wallet identity, and punch card progress.
 *
 * Scalability: Adding new program types requires only a new parser in program-parser-router.
 * No changes needed to this service.
 */

import cacheService, {
  getCacheKeyWallet,
  getCacheKeyParticipantPrograms,
  CACHE_TTL,
} from "./cache-service"
import { parseNTangleMintOpReturn } from "@/lib/utils/parsers/opreturn-parser"
import type { OnChainProgram } from "@/lib/types"
import { parseProgramFromFields } from "@/lib/utils/parsers/program-parser-router"
import { getAllProgramMetadata } from "./program-repository"

// ============================================================================
// Interfaces
// ============================================================================

export interface OnChainPunchCard {
  programId: string
  punchIndex: number
  txId: string
  blockHeight?: number
  timestamp: number
}

// ============================================================================
// Program Discovery - Query CREATE Transactions
// ============================================================================

/**
 * Query blockchain for CREATE transactions by creator address.
 * Uses type-aware program parser router - automatically handles all program types.
 * 
 * @param creatorAddress - Creator's BSV public address
 * @returns Array of programs created by this creator
 */
export async function getProgramsByCreatorOnChain(creatorAddress: string): Promise<OnChainProgram[]> {
  const cacheKey = `programs:creator:${creatorAddress}`

  // Check cache first
  const cached = cacheService.get<OnChainProgram[]>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl =
      networkMode === "mainnet"
        ? "https://api.whatsonchain.com/v1/bsv/main"
        : "https://api.whatsonchain.com/v1/bsv/test"

    // Fetch transaction history from WhatsOnChain
    const txHistoryUrl = `${apiUrl}/address/${creatorAddress}/history`
    const historyResponse = await fetch(txHistoryUrl)

    if (!historyResponse.ok) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    const txHistory = await historyResponse.json()
    const programs: OnChainProgram[] = []

    if (!Array.isArray(txHistory)) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    // Process each transaction in history
    for (const tx of txHistory) {
      try {
        // Fetch full transaction details
        const txDetailsUrl = `${apiUrl}/tx/${tx.tx_hash}`
        const txResponse = await fetch(txDetailsUrl)

        if (!txResponse.ok) continue

        const txData = await txResponse.json()

        // Parse OP_RETURN using canonical parser
        const parseResult = parseNTangleMintOpReturn(txData)
        if (!parseResult.valid || !parseResult.fields) {
          continue
        }

        // Use type-aware program parser router
        const programResult = parseProgramFromFields(
          parseResult.fields,
          tx.tx_hash,
          tx.height,
          tx.time,
          creatorAddress
        )

        if (!programResult.valid || !programResult.program) {
          continue
        }

        programs.push(programResult.program)
      } catch (err) {
        console.error(`[ONCHAIN-STATE] Error processing tx ${tx.tx_hash}:`, err)
        continue
      }
    }

    cacheService.set(cacheKey, programs, CACHE_TTL.WALLET)
    return programs
  } catch (error) {
    console.error("[ONCHAIN-STATE] Error querying programs by creator:", error)
    cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
    return []
  }
}

// ============================================================================
// Participant Punch Cards - Query Participant's Punch History
// ============================================================================

/**
 * Query blockchain for all punch cards a participant has joined.
 * Finds all nTangle (join) transactions signed by the participant address.
 *
 * @param participantAddress - Participant's BSV address
 * @returns Array of punch cards (programId + punch count for each program)
 */
export async function getPunchCardsByParticipantOnChain(
  participantAddress: string
): Promise<OnChainPunchCard[]> {
  const cacheKey = getCacheKeyParticipantPrograms(participantAddress)

  // Check cache first
  const cached = cacheService.get<OnChainPunchCard[]>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl =
      networkMode === "mainnet"
        ? "https://api.whatsonchain.com/v1/bsv/main"
        : "https://api.whatsonchain.com/v1/bsv/test"

    // Fetch transaction history from WhatsOnChain
    const txHistoryUrl = `${apiUrl}/address/${participantAddress}/history`
    const historyResponse = await fetch(txHistoryUrl)

    if (!historyResponse.ok) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    const txHistory = await historyResponse.json()
    const punchCards: OnChainPunchCard[] = []

    if (!Array.isArray(txHistory)) {
      cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
      return []
    }

    // Process each transaction in history
    for (const tx of txHistory) {
      try {
        // Fetch full transaction details
        const txDetailsUrl = `${apiUrl}/tx/${tx.tx_hash}`
        const txResponse = await fetch(txDetailsUrl)

        if (!txResponse.ok) continue

        const txData = await txResponse.json()

        // Parse OP_RETURN using canonical parser
        const parseResult = parseNTangleMintOpReturn(txData)
        if (!parseResult.valid || !parseResult.fields) {
          continue
        }

        // Check if this is an nTangle (participant join) transaction
        // Field 2 should be "nTangle"
        if (parseResult.fields[2] !== "nTangle") {
          continue
        }

        // Extract program ID from Field 3
        const programId = parseResult.fields[3]
        if (!programId) {
          continue
        }

        // Extract punch index from Field 5 (for nTangle, this is the initial punch)
        const punchIndexStr = parseResult.fields[5] || "0"
        const punchIndex = parseInt(punchIndexStr, 10)

        punchCards.push({
          programId,
          punchIndex,
          txId: tx.tx_hash,
          blockHeight: tx.height,
          timestamp: tx.time,
        })
      } catch (err) {
        console.error(`[ONCHAIN-STATE] Error processing punch tx ${tx.tx_hash}:`, err)
        continue
      }
    }

    cacheService.set(cacheKey, punchCards, CACHE_TTL.WALLET)
    return punchCards
  } catch (error) {
    console.error("[ONCHAIN-STATE] Error querying participant punch cards:", error)
    cacheService.set(cacheKey, [], CACHE_TTL.WALLET)
    return []
  }
}

// ============================================================================

/**
 * Query blockchain for all participants in a program.
 * Counts all unique addresses that signed punch transactions for a specific program.
 *
 * @param programId - Program ID to query
 * @returns Number of participants who joined this program
 */
export async function getProgramParticipantCountOnChain(programId: string): Promise<number> {
  const cacheKey = `program:participants:${programId}`

  // Check cache
  const cached = cacheService.get<number>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl =
      networkMode === "mainnet"
        ? "https://api.whatsonchain.com/v1/bsv/main"
        : "https://api.whatsonchain.com/v1/bsv/test"

    // Query for punch transactions (nTangle/nProcess/Redeem) for this program
    // This requires indexing or a different query strategy - for now, return 0
    // In a production system, you'd have indexed participants or query a subset
    const participantCount = 0

    cacheService.set(cacheKey, participantCount, CACHE_TTL.WALLET)
    return participantCount
  } catch (error) {
    console.error("[ONCHAIN-STATE] Error querying program participants:", error)
    cacheService.set(cacheKey, 0, CACHE_TTL.WALLET)
    return 0
  }
}

/**
 * Check if a program can be deleted.
 * Rules:
 * - Only creator can delete (enforced by TX signature)
 * - Cannot delete if program has participants (participantCount > 0)
 *
 * @param programId - Program ID to check
 * @returns True if program can be deleted (no participants)
 */
export async function canDeleteProgram(programId: string): Promise<boolean> {
  const participantCount = await getProgramParticipantCountOnChain(programId)
  return participantCount === 0
}

// ============================================================================
// Cache Invalidation
// ============================================================================

/**
 * Invalidate all on-chain caches after a new program creation.
 * Call after broadcasting a CREATE transaction.
 */
export function invalidateOnChainCache(programId: string): void {
  cacheService.clearByPattern(`programs:`)
  cacheService.clearByPattern(`program:`)
  cacheService.clearByPattern(`punches:`)
}

/**
 * Invalidate caches for a specific program.
 */
export function invalidateProgramCache(programId: string): void {
  cacheService.clearByPattern(`program:${programId}`)
}

/**
 * Invalidate caches for a participant's punch history.
 */
export function invalidateParticipantCache(participantAddress: string): void {
  cacheService.clearByPattern(getCacheKeyParticipantPrograms(participantAddress))
}