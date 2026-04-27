/**
 * Program Service
 * Handles loyalty program operations - CRUD, discovery, and merchant management
 */

import type { Program, ProgramStatus } from "@/lib/types"
import { getStorageItem, setStorageItem } from "./storage-service"
import { PROGRAM_DEFAULTS, BITCOIN_DUST_LIMIT, NTANGLEMINT_FORMAT_VERSION } from "@/lib/constants"
import { generateProgramID } from "./wallet-service"

const PROGRAMS_STORAGE_KEY = "ntanglemint_programs"

/** Minimum satoshis required to register a program on-chain */
export const PROGRAM_REGISTRATION_FEE = 1000

// ============================================================================
// Program Queries
// ============================================================================

/**
 * Get all programs from storage
 */
export function getAllPrograms(): Program[] {
  return getStorageItem<Program[]>(PROGRAMS_STORAGE_KEY, [])
}

/**
 * Get all active (non-deleted) programs
 * Filters out programs marked as deleted
 */
export function getActivePrograms(): Program[] {
  const programs = getAllPrograms()
  return programs.filter(p => p.status !== "deleted")
}

/**
 * Get programs for a merchant (excluding deleted ones)
 */
export function getMerchantPrograms(merchantAddress: string): Program[] {
  return getActivePrograms().filter(p => p.merchantAddress === merchantAddress)
}

/**
 * Get public programs (excluding deleted ones)
 */
export function getPublicPrograms(): Program[] {
  return getActivePrograms().filter(p => p.isPublic)
}

/**
 * Get a program by ID
 */
export function getProgramById(programId: string): Program | null {
  const programs = getAllPrograms()
  return programs.find(p => p.id === programId) || null
}

/**
 * Get programs by merchant address
 */
export function getProgramsByMerchant(merchantAddress: string): Program[] {
  return getMerchantPrograms(merchantAddress)
}

/**
 * Get all active public programs (for customer discovery)
 */
export function getActivePublicPrograms(): Program[] {
  const programs = getAllPrograms()
  return programs.filter(p => p.status === "active" && p.isPublic)
}

/**
 * Search programs by name or description
 */
export function searchPrograms(query: string): Program[] {
  const programs = getActivePublicPrograms()
  const lowerQuery = query.toLowerCase()
  
  return programs.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      (p.metadata.merchantName && p.metadata.merchantName.toLowerCase().includes(lowerQuery))
  )
}

// ============================================================================
// Program Mutations
// ============================================================================

/**
 * Create a new program (merchant only)
 *
 * Saves locally with status "inactive". No blockchain broadcast yet.
 * Program is broadcast to blockchain when activateProgram() is called.
 *
 * @param walletID - Merchant's walletID (wid_{12-char-base36})
 * @param merchantAddress - Merchant's BSV address
 * @param data - Program configuration
 */
export function createProgram(
  walletID: string,
  merchantAddress: string,
  data: {
    name: string
    description: string
    requiredPunches: number
    reward: string
    expirationDays?: number
    merchantName?: string
    isPublic?: boolean
    upcCodes?: string[]
    pricePerPunch?: number
    programType?: "accumulation" | "bogo"
  }
): Program {
  const now = new Date().toISOString()
  const expirationDays = data.expirationDays ?? PROGRAM_DEFAULTS.EXPIRATION_DAYS
  const expirationDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)

  const program: Program = {
    id: generateProgramID(), // pid_{12-char-base36}
    walletID, // Links program to merchant wallet
    type: "punch-card",
    name: data.name,
    description: data.description,
    createdAt: now,
    updatedAt: now,
    merchantAddress,
    status: "inactive", // Created as inactive - no blockchain record yet
    isPublic: data.isPublic ?? true,
    participants: [],
    metadata: {
      requiredPunches: data.requiredPunches,
      reward: data.reward,
      merchantName: data.merchantName,
      expirationDate: expirationDate.toISOString(),
      upcCodes: data.upcCodes,
      satoshisPerPunch: data.pricePerPunch,
      programType: data.programType || "accumulation",
    },
  }

  // Save locally only - no blockchain broadcast until activation
  const programs = getAllPrograms()
  programs.push(program)
  setStorageItem(PROGRAMS_STORAGE_KEY, programs)

  return program
}

/**
 * Update an existing program
 */
export function updateProgram(
  programId: string,
  merchantAddress: string,
  updates: Partial<Pick<Program, "name" | "description" | "status" | "isPublic" | "metadata">>
): Program | null {
  const programs = getAllPrograms()
  const index = programs.findIndex(p => p.id === programId && p.merchantAddress === merchantAddress)
  
  if (index === -1) return null
  
  programs[index] = {
    ...programs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  setStorageItem(PROGRAMS_STORAGE_KEY, programs)
  return programs[index]
}


/**
 * Activate a program - validates fields then broadcasts PROGRAM OP_RETURN
 *
 * On-chain format: nTangleMint | PROGRAM | {programID} | {walletID}
 *
 * Returns { success: true, program } on success
 * Returns { success: false, error: string } if validation fails or broadcast fails
 */
export async function activateProgram(
  programId: string,
  merchantAddress: string,
  merchantPrivKey: string
): Promise<{ success: boolean; program?: Program; error?: string }> {
  const program = getProgramById(programId)
  
  if (!program) {
    return { success: false, error: "Program not found" }
  }
  
  if (program.merchantAddress !== merchantAddress) {
    return { success: false, error: "Unauthorized - you do not own this program" }
  }
  
  if (program.status === "active") {
    return { success: false, error: "Program is already active" }
  }

  // Validation checks
  const validationErrors: string[] = []

  // Check satoshisPerPunch > 0 and above dust limit
  const satoshisPerPunch = program.metadata?.satoshisPerPunch
  if (!satoshisPerPunch || satoshisPerPunch <= 0) {
    validationErrors.push("Satoshis per punch must be set")
  } else if (satoshisPerPunch < BITCOIN_DUST_LIMIT) {
    validationErrors.push(`Satoshis per punch must be at least ${BITCOIN_DUST_LIMIT} (Bitcoin dust limit)`)
  }

  // Check program name filled
  if (!program.name || program.name.trim() === "") {
    validationErrors.push("Program name is required")
  }

  // Check reward description filled
  const rewardDescription = program.metadata?.reward
  if (!rewardDescription || rewardDescription.trim() === "") {
    validationErrors.push("Reward description is required")
  }

  // Check expiration date is in the future
  const expirationDate = program.metadata?.expirationDate
  if (!expirationDate) {
    validationErrors.push("Expiration date is required")
  } else {
    const expDate = new Date(expirationDate)
    if (expDate <= new Date()) {
      validationErrors.push("Expiration date must be in the future")
    }
  }

  // Check totalPunchBlocks > 0
  const totalPunches = program.metadata?.requiredPunches
  if (!totalPunches || totalPunches <= 0) {
    validationErrors.push("Number of punches must be greater than 0")
  }

  // If validation fails, return errors
  if (validationErrors.length > 0) {
    return { 
      success: false, 
      error: validationErrors.join("; ")
    }
  }

  // All validations passed - broadcast PROGRAM OP_RETURN to blockchain
  const { broadcastProgramRegistration } = await import("./program-transaction-service")

  try {
    const result = await broadcastProgramRegistration(program, merchantPrivKey, merchantAddress)

    // Update program in storage with registration txid and active status
    const programs = getAllPrograms()
    const programIndex = programs.findIndex(p => p.id === programId && p.merchantAddress === merchantAddress)

    if (programIndex === -1) {
      return { success: false, error: "Program not found after broadcast" }
    }

    programs[programIndex].status = "active"
    programs[programIndex].registrationTxid = result.txId
    programs[programIndex].updatedAt = new Date().toISOString()
    setStorageItem(PROGRAMS_STORAGE_KEY, programs)

    return { success: true, program: programs[programIndex] }
  } catch (error) {
    return {
      success: false,
      error: `Failed to broadcast PROGRAM to blockchain: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Deactivate a program - checks if active punch cards exist
 * Returns { success: true } on success
 * Returns { success: false, error: string } if punch cards are in progress
 */
export function deactivateProgram(
  programId: string,
  merchantAddress: string
): { success: boolean; error?: string } {
  const program = getProgramById(programId)
  
  if (!program) {
    return { success: false, error: "Program not found" }
  }
  
  if (program.merchantAddress !== merchantAddress) {
    return { success: false, error: "Unauthorized - you do not own this program" }
  }
  
  if (program.status === "inactive") {
    return { success: false, error: "Program is already inactive" }
  }

  // Check if any punch cards have punches > 0 for this program
  const { getAllPunchCards } = require("./storage-service")
  const allCards = getAllPunchCards()
  const activePunchCards = allCards.filter(
    (card: any) => card.programId === programId && card.punches > 0
  )

  if (activePunchCards.length > 0) {
    return {
      success: false,
      error: `Cannot deactivate - ${activePunchCards.length} active punch card(s) in progress. Customers must complete or allow to expire first.`,
    }
  }

  // No active punch cards - safe to deactivate
  const programs = getAllPrograms()
  const programIndex = programs.findIndex(p => p.id === programId && p.merchantAddress === merchantAddress)
  
  if (programIndex === -1) {
    return { success: false, error: "Program not found" }
  }

  programs[programIndex].status = "inactive"
  programs[programIndex].updatedAt = new Date().toISOString()
  setStorageItem(PROGRAMS_STORAGE_KEY, programs)
  
  return { success: true }
}

/**
 * Check if a program has any active punch cards (punches > 0)
 * Used to determine if satoshisPerPunch can be edited or if deactivation is allowed
 */
export function programHasActivePunches(programId: string): boolean {
  try {
    const { getAllPunchCards } = require("./storage-service")
    const allPunchCards = getAllPunchCards()
    const activePunchCards = allPunchCards.filter(
      (card: any) => card.programId === programId && card.punches > 0
    )
    return activePunchCards.length > 0
  } catch (error) {
    console.error("[v0] Error checking for active punches:", error)
    return false
  }
}

/**
 * Delete a program by broadcasting DELETE OP_RETURN.
 *
 * On-chain format: nTangleMint | DELETE | {programID} | {walletID} | reserved1-7
 *
 * Format is extensible - reserved fields allow future additions without breaking backward compatibility.
 * Marks program as "deleted" locally after successful broadcast.
 */
export async function deleteProgram(
  programId: string,
  merchantAddress: string,
  merchantPrivKey: string
): Promise<boolean> {
  try {
    const program = getProgramById(programId)
    if (!program) {
      return false
    }

    const { sendTransaction } = await import("./transaction-service")

    // DELETE format: nTangleMint | DELETE | {programID} | {walletID} | reserved1-7
    const opReturnData = [
      "nTangleMint",
      "DELETE",
      program.id,
      program.walletID,
      "", // reserved1
      "", // reserved2
      "", // reserved3
      "", // reserved4
      "", // reserved5
      "", // reserved6
      "", // reserved7
    ].join("\x00")

    const result = await sendTransaction({
      senderPrivKeyWif: merchantPrivKey,
      senderAddress: merchantAddress,
      outputs: [],
      opReturn: {
        data: [opReturnData],
      },
    })

    if (!result?.txId) {
      return false
    }

    // Update local storage
    const programs = getAllPrograms()
    const index = programs.findIndex(p => p.id === programId)
    if (index !== -1) {
      programs[index].status = "deleted"
      programs[index].deletionTxid = result.txId
      programs[index].updatedAt = new Date().toISOString()
      setStorageItem(PROGRAMS_STORAGE_KEY, programs)
    }

    return true
  } catch {
    return false
  }
}

/**
 * Initialize demo programs (stub for backward compatibility)
 * Can be used to populate demo data if needed
 */
export function initializeDemoPrograms(): void {
  // Stub function - can be extended to populate demo data
  // Check if programs already exist before initializing
  const programs = getAllPrograms()
  if (programs.length === 0) {
    // Demo programs can be added here if needed
  }
}

// ============================================================================
// Program Recovery from Blockchain
// ============================================================================

/**
 * Recover programs from on-chain data during wallet restoration.
 * 
 * Handles both old format (v1 test programs with minimal data) and new format 
 * (programs with full details: name, reward, requiredPunches, expirationDays).
 * 
 * This extensible approach allows recovery to improve as the OP_RETURN format evolves
 * without breaking backward compatibility with existing on-chain programs.
 */
export async function recoverProgramsFromChain(
  onChainPrograms: Array<{
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
  }>,
  merchantAddress: string
): Promise<number> {
  const existingPrograms = getAllPrograms()
  const existingIds = new Set(existingPrograms.map(p => p.id))
  
  let recoveredCount = 0
  
  for (const chainProgram of onChainPrograms) {
    // Skip if program already exists locally
    if (existingIds.has(chainProgram.programId)) {
      console.log("[v0] Program already exists locally:", chainProgram.programId)
      continue
    }
    
    // Calculate expiration date from expirationDays if available
    let expirationDate: string | undefined
    if (chainProgram.expirationDays) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + chainProgram.expirationDays)
      expirationDate = futureDate.toISOString()
    }
    
    // Create program from on-chain data with full recovered details
    const recoveredProgram: Program = {
      id: chainProgram.programId,
      walletID: chainProgram.walletID,
      type: "punch-card",
      name: chainProgram.programName || "Recovered Program",
      description: chainProgram.programName 
        ? `This ${chainProgram.programName} program was recovered from the blockchain.`
        : "This program was recovered from the blockchain. Edit to add details.",
      merchantAddress: merchantAddress,
      status: "active" as ProgramStatus,
      isPublic: true,
      participants: [],
      metadata: {
        requiredPunches: chainProgram.requiredPunches || PROGRAM_DEFAULTS.TOTAL_PUNCH_BLOCKS,
        reward: chainProgram.reward || "See program details",
        expirationDate,
      },
      registrationTxid: chainProgram.txId,
      blockHeight: chainProgram.blockHeight,
      createdAt: new Date(chainProgram.timestamp * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    existingPrograms.push(recoveredProgram)
    recoveredCount++
  }
  
  if (recoveredCount > 0) {
    setStorageItem(PROGRAMS_STORAGE_KEY, existingPrograms)
  }
  
  return recoveredCount
}