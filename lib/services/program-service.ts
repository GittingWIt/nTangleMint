/**
 * Program Service - Phase 6: Blockchain-Native
 * 
 * Handles loyalty program operations - creation, query, and on-chain recovery.
 * Programs are identified by blockchain identity (creatorAddress) not application IDs.
 * Data is blockchain-native via OP_RETURN, validated against on-chain records.
 * 
 * Registration fees are network-adaptive to ensure economic feasibility regardless of BSV appreciation.
 */

import type { Program, ProgramStatus } from "@/lib/types"
import { getStorageItem, setStorageItem } from "./storage-service"
import { PROGRAM_DEFAULTS } from "@/lib/constants"
import { generateProgramID } from "./wallet-service"
import { getProgramsByCreatorOnChain } from "./onchain-state-service"
import { getCacheKeyCreatorPrograms, invalidateCreatorProgramsCache } from "./cache-service"
import { getProgramMetadata, saveProgramMetadata, getProgramMetadataByCreator } from "./program-repository"

// Re-export for convenience
export { getProgramMetadata as getProgramMetadataById, saveProgramMetadata, getProgramMetadataByCreator }

const PROGRAMS_METADATA_KEY = "ntanglemint_programs_metadata"

/**
 * Get network-adapted program registration fee in satoshis
 * Ensures barrier to entry stays economically reasonable as BSV appreciates
 * 
 * Strategy: Base fee (~1000 satoshis) adapted to current network conditions
 * This prevents the cost from becoming prohibitive if BSV price increases
 */
export async function getProgramRegistrationFee(): Promise<number> {
  try {
    // In production, this would query network fee rates from mempool API
    // For now, return adaptive base fee that can be adjusted based on network state
    const baseFee = 1000 // satoshis - baseline registration cost
    
    // Future: Multiply by network fee factor from mempool.space or similar
    // const networkFactor = await getNetworkFeeMultiplier()
    // return Math.max(baseFee, Math.ceil(baseFee * networkFactor))
    
    return baseFee
  } catch (error) {
    console.warn("[program-service] Could not calculate network-based fee, using base:", error)
    return 1000
  }
}

// ============================================================================
// Program Queries - Blockchain-Native
// ============================================================================

/**
 * Get creator's programs from blockchain, excluding deleted programs
 * A program is deleted if it has a Delete transaction with the same programID
 */
export async function getCreatorPrograms(creatorAddress: string): Promise<Program[]> {
  try {
    // Fetch all programs from blockchain for this creator
    const programs = await getProgramsByCreatorOnChain(creatorAddress)
    console.log("[v0] getCreatorPrograms: fetched", programs.length, "programs")
    
    // Fetch transaction history via our API (already parses OP_RETURN and identifies Delete txs)
    let deletedProgramIds = new Set<string>()
    
    try {
      const txResponse = await fetch(`/api/external/transactions?address=${creatorAddress}`)
      
      if (txResponse.ok) {
        const txData = await txResponse.json()
        console.log("[v0] Transaction response count:", txData.transactions?.length || 0)
        
        if (Array.isArray(txData.transactions)) {
          // Filter for Delete transactions and collect program IDs
          for (const tx of txData.transactions) {
            if (tx.type === "Delete" && tx.programId) {
              console.log("[v0] Found Delete tx for program:", tx.programId)
              deletedProgramIds.add(tx.programId)
            }
          }
        }
      }
    } catch (error) {
      console.warn("[v0] Error fetching transactions:", error)
    }

    console.log("[v0] Deleted program IDs:", Array.from(deletedProgramIds))
    
    // Filter out deleted programs and set status
    const filtered = programs
      .filter(p => {
        const isDeleted = deletedProgramIds.has(p.id)
        if (isDeleted) {
          console.log("[v0] FILTERING OUT deleted program:", p.id)
        }
        return !isDeleted
      })
      .map(program => ({
        ...program,
        status: (program.expirationDays && program.expirationDays > 0) ? 'active' : 'inactive'
      })) as Program[]
    
    console.log("[v0] Returning", filtered.length, "programs after filtering")
    return filtered
  } catch (error) {
    console.warn("[v0] Error in getCreatorPrograms:", error)
    return []
  }
}

// ============================================================================
// Program Mutations - Blockchain-Based
// ============================================================================

/**
 * Create a new program locally and prepare for broadcast
 * Program is NOT active until broadcastProgramCreation() is called
 * 
 * @param creatorAddress - Creator's BSV public address (blockchain identity)
 * @param data - Program configuration including name for OP_RETURN
 */
export function createProgram(
  creatorAddress: string,
  data: {
    name: string
    description: string
    requiredPunches: number
    reward: string
    expirationDays?: number
    satoshisPerPunch: number
  }
): any {
  const now = new Date().toISOString()
  const expirationDays = data.expirationDays ?? PROGRAM_DEFAULTS.EXPIRATION_DAYS
  const expirationDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)

  // Return object matching full Program interface (extends OnChainProgram)
  const program: any = {
    // OnChainProgram fields (required by Program type)
    id: generateProgramID(),
    creatorAddress, // Blockchain-native identity
    type: "punch-card",
    name: data.name,
    description: data.description,
    requiredPunches: data.requiredPunches,
    expirationDays: expirationDays,
    reward: data.reward,
    metadata: {
      satoshisPerPunch: data.satoshisPerPunch,
    },
    status: "inactive", // Not broadcast yet - will become "active" after broadcastProgramCreation
    participantCount: 0, // No participants until program is active
    createdAt: now,
    updatedAt: now,
    registrationTxid: "", // Set after broadcast
    blockHeight: undefined,
    deletionTxid: undefined,

    // Program-specific fields (for UI)
    isPublic: true,
    participants: [],
    maxParticipants: undefined,
    perUserLimit: undefined,
  }

  return program
}

/**
 * Validate program before broadcast
 * Checks all required fields and constraints
 */
export function validateProgramForBroadcast(program: Program): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check satoshisPerPunch (from data object)
  const satoshisPerPunch = program.data?.satoshisPerPunch
  if (!satoshisPerPunch || satoshisPerPunch <= 0) {
    errors.push("Satoshis per punch must be greater than 0")
  }

  // Check program name (top-level field)
  if (!program.name || program.name.trim() === "") {
    errors.push("Program name is required (will be immutable on-chain)")
  }

  // Check reward description (top-level field)
  if (!program.reward || program.reward.trim() === "") {
    errors.push("Reward description is required")
  }

  // Check required punches (top-level field)
  if (!program.requiredPunches || program.requiredPunches <= 0) {
    errors.push("Number of punches must be greater than 0")
  }

  // Check expiration days (top-level field)
  if (!program.expirationDays || program.expirationDays <= 0) {
    errors.push("Expiration period must be greater than 0 days")
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Broadcast program creation to blockchain
 * Creates immutable on-chain record with program name at Field 5
 * 
 * @param program - Program object to broadcast (draft with temporary draft ID)
 * @param creatorPrivKey - Creator's private key
 * @param creatorAddress - Creator's BSV public address
 */
export async function broadcastProgramCreation(
  program: Program,
  creatorPrivKey: string,
  creatorAddress: string
): Promise<{ success: boolean; txId?: string; error?: string }> {
  const validation = validateProgramForBroadcast(program)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("; ") }
  }

  try {
    const { broadcastProgramRegistration } = await import("./program-transaction-service")
    const { generateProgramId } = await import("../utils/common")
    
    // Generate a real programId (from draft_xxxx -> pid_xxxx) at activation time
    const realProgramId = generateProgramId()
    
    // Create program object with real ID for broadcast
    const programWithRealId = {
      ...program,
      id: realProgramId, // Replace draft ID with real programId
    }
    
    const result = await broadcastProgramRegistration(programWithRealId, creatorPrivKey, creatorAddress)

    // Cache program metadata locally (name is immutable)
    saveProgramMetadata({
      programId: realProgramId,
      programName: program.name,
      creatorAddress,
      creatorName: program.metadata?.creatorName,
      lastSeenOnChain: Date.now(),
      verifiedOnChain: false, // Will be verified after broadcast confirmation
    })

    // Invalidate creator program cache
    invalidateCreatorProgramsCache(creatorAddress)

    return { success: true, txId: result.txId }
  } catch (error) {
    return {
      success: false,
      error: `Failed to broadcast program: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Delete a program by broadcasting Delete transaction
 * Marks program as deleted on-chain (immutable)
 * 
 * @param programId - Program ID to delete
 * @param creatorAddress - Creator's BSV public address
 * @param creatorPrivKey - Creator's private key for signing
 */
export async function deleteProgram(
  programId: string,
  creatorAddress: string,
  creatorPrivKey: string
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    const { broadcastProgramDeletion } = await import("./program-transaction-service")
    
    // Fetch program metadata to get the program name (required for DELETE transaction)
    const metadata = getProgramMetadata(programId)
    const programName = metadata?.programName || "Unknown Program"
    
    // Broadcast DELETE transaction with all required parameters
    const result = await broadcastProgramDeletion(
      programId,
      programName,
      creatorAddress,
      creatorPrivKey
    )

    // Invalidate cache after deletion
    invalidateCreatorProgramsCache(creatorAddress)

    return { success: true, txId: result.txId }
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete program: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}