/**
 * Program Repository
 *
 * Lightweight local cache for program metadata (names only).
 * Program data (transactions, status, punch counts) lives on-chain in OP_RETURN.
 * This repository stores optional display metadata that doesn't fit in OP_RETURN.
 *
 * Single source of truth for program metadata:
 * - programID (primary key)
 * - programName (immutable, also in OP_RETURN field 5)
 * - creatorName (optional, for display)
 * - lastSeenOnChain (timestamp of last on-chain verification)
 */

import { getStorageItem, setStorageItem } from "./storage-service"

export interface ProgramMetadata {
  programId: string
  programName: string
  creatorAddress: string
  creatorName?: string
  lastSeenOnChain: number
  verifiedOnChain: boolean
}

const PROGRAM_METADATA_STORAGE_KEY = "ntanglemint_program_metadata"

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get program metadata by ID
 * @param programId - Program ID (pid_{12-char-base36})
 */
export function getProgramMetadata(programId: string): ProgramMetadata | null {
  const allMetadata = getAllProgramMetadata()
  return allMetadata.find(m => m.programId === programId) || null
}

/**
 * Get all program metadata
 */
export function getAllProgramMetadata(): ProgramMetadata[] {
  return getStorageItem<ProgramMetadata[]>(PROGRAM_METADATA_STORAGE_KEY, [])
}

/**
 * Get program metadata by creator address
 * @param creatorAddress - Creator's BSV public address
 */
export function getProgramMetadataByCreator(creatorAddress: string): ProgramMetadata[] {
  const allMetadata = getAllProgramMetadata()
  return allMetadata.filter(m => m.creatorAddress === creatorAddress)
}

/**
 * Search program metadata by name
 * @param query - Search term
 */
export function searchProgramMetadata(query: string): ProgramMetadata[] {
  const allMetadata = getAllProgramMetadata()
  const lowerQuery = query.toLowerCase()
  return allMetadata.filter(
    m =>
      m.programName.toLowerCase().includes(lowerQuery) ||
      (m.creatorName && m.creatorName.toLowerCase().includes(lowerQuery))
  )
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Save or update program metadata
 * @param metadata - Program metadata to save
 */
export function saveProgramMetadata(metadata: ProgramMetadata): void {
  const allMetadata = getAllProgramMetadata()
  const index = allMetadata.findIndex(m => m.programId === metadata.programId)

  if (index === -1) {
    allMetadata.push(metadata)
  } else {
    allMetadata[index] = metadata
  }

  setStorageItem(PROGRAM_METADATA_STORAGE_KEY, allMetadata)
}

/**
 * Update program metadata with verification status
 * Called when on-chain data is verified
 * @param programId - Program ID
 * @param verifiedData - Data verified from on-chain
 */
export function verifyProgramOnChain(
  programId: string,
  verifiedData: { programName: string; creatorAddress: string }
): void {
  let metadata = getProgramMetadata(programId)

  if (!metadata) {
    // Create new metadata from verified on-chain data
    metadata = {
      programId,
      programName: verifiedData.programName,
      creatorAddress: verifiedData.creatorAddress,
      lastSeenOnChain: Date.now(),
      verifiedOnChain: true,
    }
  } else {
    // Verify programName immutability
    if (metadata.programName !== verifiedData.programName) {
      console.warn(
        `[verifyProgramOnChain] Program name mismatch for ${programId}. Local: "${metadata.programName}", On-chain: "${verifiedData.programName}". Using on-chain value.`
      )
      metadata.programName = verifiedData.programName
    }

    // Verify creatorAddress immutability
    if (metadata.creatorAddress !== verifiedData.creatorAddress) {
      console.warn(
        `[verifyProgramOnChain] Creator address mismatch for ${programId}. Local: "${metadata.creatorAddress}", On-chain: "${verifiedData.creatorAddress}". Using on-chain value.`
      )
      metadata.creatorAddress = verifiedData.creatorAddress
    }

    metadata.lastSeenOnChain = Date.now()
    metadata.verifiedOnChain = true
  }

  saveProgramMetadata(metadata)
}

/**
 * Update program creator name (optional display name)
 * @param programId - Program ID
 * @param creatorName - Optional creator display name
 */
export function updateCreatorName(programId: string, creatorName: string): void {
  const metadata = getProgramMetadata(programId)

  if (!metadata) {
    console.warn(`[updateCreatorName] Program metadata not found for ${programId}`)
    return
  }

  metadata.creatorName = creatorName
  saveProgramMetadata(metadata)
}

/**
 * Delete program metadata
 * @param programId - Program ID to delete
 */
export function deleteProgramMetadata(programId: string): void {
  const allMetadata = getAllProgramMetadata()
  const filtered = allMetadata.filter(m => m.programId !== programId)
  setStorageItem(PROGRAM_METADATA_STORAGE_KEY, filtered)
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that program name has not changed on-chain (immutability check)
 * @param programId - Program ID
 * @param currentOnChainName - Current program name from on-chain
 */
export function validateProgramNameImmutability(programId: string, currentOnChainName: string): boolean {
  const metadata = getProgramMetadata(programId)

  if (!metadata) {
    // First time seeing this program
    return true
  }

  if (metadata.programName !== currentOnChainName) {
    console.error(
      `[validateProgramNameImmutability] VIOLATION: Program name changed! ID: ${programId}, Expected: "${metadata.programName}", Found: "${currentOnChainName}"`
    )
    return false
  }

  return true
}

/**
 * Validate that creator address has not changed on-chain (immutability check)
 * @param programId - Program ID
 * @param currentOnChainCreator - Current creator address from on-chain
 */
export function validateCreatorAddressImmutability(programId: string, currentOnChainCreator: string): boolean {
  const metadata = getProgramMetadata(programId)

  if (!metadata) {
    // First time seeing this program
    return true
  }

  if (metadata.creatorAddress !== currentOnChainCreator) {
    console.error(
      `[validateCreatorAddressImmutability] VIOLATION: Creator address changed! ID: ${programId}, Expected: "${metadata.creatorAddress}", Found: "${currentOnChainCreator}"`
    )
    return false
  }

  return true
}