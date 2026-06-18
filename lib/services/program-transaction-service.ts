/**
 * Program Transaction Service
 *
 * Broadcasts nTangleMint transactions to the BSV blockchain.
 * Phase 7 Architecture: 14-field structure (Field 4 = programName, NO BSV TX ID field)
 *
 * OP_RETURN Format (14 fields):
 * Field 0: "nTangleMint" (protocol)
 * Field 1: Program Type ("PunchCard", future: "Loyalty", "Coupon", etc.)
 * Field 2: Transaction Type ("Create", "nTangle", "nProcess", "Redeem", "Delete")
 * Field 3: programID (pid_{12-char-base36})
 * Field 4: programName (URL-encoded, immutable on-chain)
 * Field 5+: Type-specific data (PunchCard: requiredPunches, expirationDays, reward, satoshisPerPunch)
 * Fields 9-13: Reserved for future use
 *
 * Identity (creator vs participant) is derived from blockchain context (TX signature),
 * NOT stored in OP_RETURN. Full program metadata stored in database.
 */

import { sendTransaction } from "./transaction-service"
import type { Program } from "@/lib/types"
import {
  buildPunchCardCreateTransaction,
  buildPunchCardNTangleTransaction,
  buildPunchCardNProcessTransaction,
  buildPunchCardRedeemTransaction,
  buildPunchCardDeleteTransaction,
} from "@/lib/constants/punchcard-schema"
import { PROGRAM_TYPES_OP_RETURN } from "@/lib/constants/core-field-positions"
import { invalidateOnChainCache } from "./onchain-state-service"

// ============================================================================
// CREATE Transaction - Program Registration
// ============================================================================

/**
 * Broadcast CREATE transaction to register a program on-chain.
 *
 * @param program - Program object to broadcast
 * @param creatorPrivKey - Creator's private key to sign the transaction
 * @param creatorAddress - Creator's BSV public address
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastProgramRegistration(
  program: Program,
  creatorPrivKey: string,
  creatorAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  const programName = program.name || "Unnamed Program"
  const requiredPunches = program.requiredPunches || 6
  
  let expirationDays = program.expirationDays || 365

  const reward = program.reward || "See program details"
  const satoshisPerPunch = program.data?.satoshisPerPunch || 1000

  // Build CREATE transaction using new 14-field structure
  const createSchema = buildPunchCardCreateTransaction(
    program.id,
    programName,
    requiredPunches,
    expirationDays,
    reward,
    satoshisPerPunch
  )
  
  // Extract the 14-field array from schema object
  const createTx: string[] = [
    createSchema.field0,
    createSchema.field1,
    createSchema.field2,
    createSchema.field3,
    createSchema.field4,
    createSchema.field5 || "",
    createSchema.field6 || "",
    createSchema.field7 || "",
    createSchema.field8 || "",
    "", "", "", "", "",
  ]

  // Broadcast as 14-field OP_RETURN array
  const result = await sendTransaction({
    senderPrivKeyWif: creatorPrivKey,
    senderAddress: creatorAddress,
    outputs: [],
    opReturn: {
      data: createTx,
    },
  })

  invalidateOnChainCache(program.id)
  return result
}

// ============================================================================
// NTANGLE Transaction - First Punch / Participant Joins
// ============================================================================

/**
 * Broadcast nTangle transaction (first punch / participant joins program).
 *
 * @param programId - Program ID to punch
 * @param programName - Program name (from on-chain data)
 * @param expirationDays - Program expiration days (for validation)
 * @param participantPrivKey - Participant's private key
 * @param participantAddress - Participant's BSV address
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastNTangleTransaction(
  programId: string,
  programName: string,
  expirationDays: number,
  participantPrivKey: string,
  participantAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  const nTangleSchema = buildPunchCardNTangleTransaction(
    programId,
    programName,
    expirationDays
  )
  
  const nTangleTx: string[] = [
    nTangleSchema.field0,
    nTangleSchema.field1,
    nTangleSchema.field2,
    nTangleSchema.field3,
    nTangleSchema.field4,
    nTangleSchema.field5,
    nTangleSchema.field6,
    "", "", "", "", "", "", "",
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: participantPrivKey,
    senderAddress: participantAddress,
    outputs: [],
    opReturn: {
      data: nTangleTx,
    },
  })

  invalidateOnChainCache(programId)
  return result
}

// ============================================================================
// NPROCESS Transaction - Subsequent Punch
// ============================================================================

/**
 * Broadcast nProcess transaction (subsequent punch / accumulation).
 *
 * @param programId - Program ID
 * @param programName - Program name (from on-chain data)
 * @param punchIndex - Current punch number
 * @param expirationDays - Program expiration days
 * @param participantPrivKey - Participant's private key
 * @param participantAddress - Participant's BSV address
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastNProcessTransaction(
  programId: string,
  programName: string,
  punchIndex: number,
  expirationDays: number,
  participantPrivKey: string,
  participantAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  const nProcessSchema = buildPunchCardNProcessTransaction(
    programId,
    programName,
    punchIndex,
    expirationDays
  )
  
  const nProcessTx: string[] = [
    nProcessSchema.field0,
    nProcessSchema.field1,
    nProcessSchema.field2,
    nProcessSchema.field3,
    nProcessSchema.field4,
    nProcessSchema.field5,
    nProcessSchema.field6,
    "", "", "", "", "", "", "",
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: participantPrivKey,
    senderAddress: participantAddress,
    outputs: [],
    opReturn: {
      data: nProcessTx,
    },
  })

  invalidateOnChainCache(programId)
  return result
}

// ============================================================================
// REDEEM Transaction - Final Punch / Reward Claim
// ============================================================================

/**
 * Broadcast Redeem transaction (final punch / reward claim).
 *
 * @param programId - Program ID
 * @param programName - Program name (from on-chain data)
 * @param punchIndex - Final punch index (should equal requiredPunches)
 * @param expirationDays - Program expiration days
 * @param participantPrivKey - Participant's private key
 * @param participantAddress - Participant's BSV address
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastRedeemTransaction(
  programId: string,
  programName: string,
  punchIndex: number,
  expirationDays: number,
  participantPrivKey: string,
  participantAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  const redeemSchema = buildPunchCardRedeemTransaction(
    programId,
    programName,
    punchIndex,
    expirationDays
  )
  
  const redeemTx: string[] = [
    redeemSchema.field0,
    redeemSchema.field1,
    redeemSchema.field2,
    redeemSchema.field3,
    redeemSchema.field4,
    redeemSchema.field5,
    redeemSchema.field6,
    "", "", "", "", "", "", "",
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: participantPrivKey,
    senderAddress: participantAddress,
    outputs: [],
    opReturn: {
      data: redeemTx,
    },
  })

  invalidateOnChainCache(programId)
  return result
}

// ============================================================================
// DELETE Transaction - Program Deletion
// ============================================================================

/**
 * Broadcast Delete transaction to mark a program as deleted on-chain.
 * Immutable record - cannot be undone. Only creator can delete.
 *
 * @param programId - Program ID to delete
 * @param creatorAddress - Creator's BSV address
 * @param creatorPrivKey - Creator's private key
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastProgramDeletion(
  programId: string,
  programName: string,
  creatorAddress: string,
  creatorPrivKey: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  return broadcastDeleteTransaction(programId, programName, creatorPrivKey, creatorAddress)
}

/**
 * Broadcast Delete transaction (program deletion).
 * Only creator can delete. Cannot delete if program has participants.
 *
 * @param programId - Program ID to delete
 * @param programName - Program name (from on-chain data)
 * @param creatorPrivKey - Creator's private key
 * @param creatorAddress - Creator's BSV address
 * @returns Transaction ID, hex, and fee
 */
export async function broadcastDeleteTransaction(
  programId: string,
  programName: string,
  creatorPrivKey: string,
  creatorAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  const deleteSchema = buildPunchCardDeleteTransaction(
    programId,
    programName
  )
  
  const deleteTx: string[] = [
    deleteSchema.field0,
    deleteSchema.field1,
    deleteSchema.field2,
    deleteSchema.field3,
    deleteSchema.field4,
    "", "", "", "", "", "", "", "", "",
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: creatorPrivKey,
    senderAddress: creatorAddress,
    outputs: [],
    opReturn: {
      data: deleteTx,
    },
  })

  invalidateOnChainCache(programId)
  return result
}

// ============================================================================
// Query Functions (Future Enhancement)
// ============================================================================

/**
 * Query blockchain for all registered programs
 * Searches for transactions with nTangleMint | PunchCard | Create OP_RETURN data.
 * TODO: Implement using WhatsOnChain API or similar
 */
export async function queryRegisteredPrograms(): Promise<
  Array<{
    programId: string
    txId: string
    blockHeight: number
    timestamp: number
  }>
> {
  console.log("[v0] Blockchain program query not yet implemented (Phase 7 - API Routes)")
  return []
}

/**
 * Check if a program is registered on-chain
 * @param programId - Program ID to check
 * @returns True if program exists on blockchain
 */
export async function isProgramRegistered(programId: string): Promise<boolean> {
  const programs = await queryRegisteredPrograms()
  return programs.some((p) => p.programId === programId)
}