/**
 * Punch Card Service
 *
 * Handles the complete punch card lifecycle on the BSV blockchain.
 * Phase 7 Architecture: 14-field structure (Field 4 = programName)
 *
 * Transaction types (Field 2 in OP_RETURN) are DERIVED from punchIndex:
 *   nTangle   - First punch, card creation (punchIndex=1)
 *   nProcess  - Subsequent punch, accumulation (1 < punchIndex < requiredPunches)
 *   Redeem    - Final punch, reward claimed (punchIndex = requiredPunches)
 */

import type { Program, PunchCard, PunchCardStatus } from "@/lib/types"
import { getPunchCardsByParticipant, savePunchCard, getPunchCardByProgramId } from "./storage-service"
import { sendTransaction } from "./transactions"
import { getStoredMnemonic, getStoredPassword, getPrivKeyWif } from "./wallet-service"
import { invalidateOnChainCache } from "./onchain-state-service"
import {
  buildPunchCardNTangleTransaction,
  buildPunchCardNProcessTransaction,
  buildPunchCardRedeemTransaction,
} from "@/lib/constants/punchcard-schema"

// ============================================================================
// Punch Card Queries
// ============================================================================

/**
 * Get all active punch cards for a wallet holder.
 * @param publicAddress - Participant's BSV public address
 */
export function getActivePunchCards(publicAddress: string): PunchCard[] {
  const cards = getPunchCardsByParticipant(publicAddress)
  return cards.filter(card => card.status === "active")
}

/**
 * Get all redeemed punch cards for a wallet holder.
 * @param publicAddress - Participant's BSV public address
 */
export function getCompletedPunchCards(publicAddress: string): PunchCard[] {
  const cards = getPunchCardsByParticipant(publicAddress)
  return cards.filter(card => card.status === "redeemed")
}

/**
 * Get a specific punch card.
 * @param publicAddress - Participant's BSV public address
 * @param programId - Program ID (pid_{12-char-base36})
 */
export function getPunchCard(publicAddress: string, programId: string): PunchCard | null {
  return getPunchCardByProgramId(publicAddress, programId)
}

/**
 * Check if a wallet has a punch card for a program.
 * @param publicAddress - Participant's BSV public address
 * @param programId - Program ID
 */
export function hasPunchCard(publicAddress: string, programId: string): boolean {
  return getPunchCardByProgramId(publicAddress, programId) !== null
}

/**
 * Count unique participants that have joined a program.
 * Queries all punch cards and finds unique addresses for the given program.
 */
export function getParticipantCountForProgram(programId: string): number {
  if (typeof window === "undefined") return 0
  
  try {
    const keys = Object.keys(localStorage)
    const punchCardKeys = keys.filter(k => k.startsWith("punchcards_1") || k.startsWith("punchcards_3"))
    
    const uniqueAddresses = new Set<string>()
    
    for (const key of punchCardKeys) {
      const publicAddress = key.replace("punchcards_", "")
      const stored = localStorage.getItem(key)
      if (!stored) continue
      
      try {
        const cards: PunchCard[] = JSON.parse(stored)
        const hasProgram = cards.some(card => card.programId === programId && card.punches > 0)
        if (hasProgram) {
          uniqueAddresses.add(publicAddress)
        }
      } catch {
        // Skip malformed entries
      }
    }
    
    return uniqueAddresses.size
  } catch {
    return 0
  }
}

// ============================================================================
// nTangle - First Purchase (Card Creation)
// ============================================================================

/**
 * Create a punch card via nTangle transaction (14-field structure).
 * Uses programName from the program object to build the complete OP_RETURN.
 *
 * @param program - The program being joined (must have id, name, expirationDays, metadata)
 * @param publicAddress - Participant's BSV public address
 * @throws If program is invalid, publicAddress is missing, or wallet cannot sign
 */
export async function nTangle(
  program: Program,
  publicAddress: string,
): Promise<PunchCard> {
  if (!program?.id) {
    throw new Error("Invalid program")
  }

  if (!publicAddress) {
    throw new Error("Public address is required for nTangle transaction")
  }

  const mnemonic = getStoredMnemonic()
  if (!mnemonic) {
    throw new Error("Wallet mnemonic not available. Please log in again.")
  }

  // Validate required program fields
  const requiredPunches = program.requiredPunches
  if (!requiredPunches || requiredPunches <= 0) {
    throw new Error("Program is missing requiredPunches - cannot create punch card")
  }

  const expirationDays = program.expirationDays
  if (expirationDays === undefined) {
    throw new Error("Program is missing expirationDays - cannot create punch card")
  }

  const reward = program.reward
  if (!reward) {
    throw new Error("Program is missing reward - cannot create punch card")
  }

  const satoshisPerPunch = program.data?.satoshisPerPunch
  if (!satoshisPerPunch || satoshisPerPunch <= 0) {
    throw new Error("Program is missing satoshisPerPunch in data field - cannot create punch card")
  }

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)

  // Build 14-field OP_RETURN array using builder
  // Builders return schema objects that must be converted to arrays for broadcasting
  const nTangleSchema = buildPunchCardNTangleTransaction(
    program.id,
    program.name || "Unnamed Program",
    expirationDays
  )
  
  // Extract the 14-field array from schema object
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
    senderAddress: publicAddress,
    senderPrivKeyWif: privKeyWif,
    outputs: [
      {
        address: program.creatorAddress,
        satoshis: satoshisPerPunch,
      },
    ],
    opReturn: {
      data: nTangleTx,
    },
  })

  const now = new Date().toISOString()

  const punchCard: PunchCard = {
    txId: result.txId,
    programId: program.id,
    program,
    participantAddress: publicAddress,
    punches: 1,
    requiredPunches,
    reward,
    createdAt: now,
    updatedAt: now,
    status: "active",
  }

  savePunchCard(punchCard, publicAddress)
  invalidateOnChainCache(program.id)

  return punchCard
}

// Backward-compatible alias
export const createPunchCard = nTangle

// ============================================================================
// nProcess - Subsequent Punches
// ============================================================================

/**
 * Process a subsequent punch via nProcess transaction (14-field structure).
 * Each call increments the punch count and broadcasts the new punch index.
 * Requires the full program object to include programName in OP_RETURN.
 *
 * @param publicAddress - Participant's BSV public address
 * @param program - The program (must include name for OP_RETURN)
 * @throws If no punch card exists or card is not active
 */
export async function nProcess(
  publicAddress: string,
  program: Program,
): Promise<{ txId: string; punchCard: PunchCard }> {
  const existingCard = getPunchCard(publicAddress, program.id)

  if (!existingCard) {
    throw new Error("No punch card found. Please join first via nTangle.")
  }

  if (existingCard.status !== "active") {
    throw new Error(`Punch card is ${existingCard.status}. Cannot add more punches.`)
  }

  const mnemonic = getStoredMnemonic()
  if (!mnemonic) {
    throw new Error("Wallet mnemonic not available. Please log in again.")
  }

  const satoshisPerPunch = program.data?.satoshisPerPunch
  if (!satoshisPerPunch || satoshisPerPunch <= 0) {
    throw new Error("Program is missing satoshisPerPunch in data field - cannot process punch")
  }

  const expirationDays = program.expirationDays
  if (expirationDays === undefined) {
    throw new Error("Program is missing expirationDays - cannot process punch")
  }

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)

  // Check if this punch will complete the card
  const willComplete = (existingCard.punches + 1) >= existingCard.requiredPunches

  // Build 14-field OP_RETURN array using builder
  // Pass the next punch index and program metadata
  const nProcessSchema = buildPunchCardNProcessTransaction(
    program.id,
    program.name || "Unnamed Program",
    existingCard.punches + 1,
    expirationDays
  )
  
  // Extract the 14-field array from schema object
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
    senderAddress: publicAddress,
    senderPrivKeyWif: privKeyWif,
    outputs: willComplete
      ? []
      : [{ address: program.creatorAddress, satoshis: satoshisPerPunch }],
    opReturn: {
      data: nProcessTx,
    },
  })

  // Update local state
  existingCard.punches += 1
  existingCard.updatedAt = new Date().toISOString()

  if (existingCard.punches >= existingCard.requiredPunches) {
    existingCard.completionTxId = result.txId
  }

  savePunchCard(existingCard, publicAddress)
  invalidateOnChainCache(program.id)

  return { txId: result.txId, punchCard: existingCard }
}

// Backward-compatible alias
export const processPunchTransaction = nProcess

/**
 * Legacy addPunch function (delegates to nProcess).
 * @deprecated Use nProcess instead
 */
export async function addPunch(
  publicAddress: string,
  programId: string,
  program: Program
): Promise<PunchCard | null> {
  const card = getPunchCard(publicAddress, programId)
  if (!card) return null

  const result = await nProcess(publicAddress, program)
  return result.punchCard
}

// ============================================================================
// Redeem - Reward Claimed
// ============================================================================

/**
 * Redeem a completed punch card via Redeem transaction (14-field structure).
 * Marks the program as complete (redeemed) for this participant.
 * Requires the full program object to include programName in OP_RETURN.
 *
 * @param publicAddress - Participant's BSV public address
 * @param program - The program (must include name for OP_RETURN)
 * @throws If punch card doesn't exist, is not complete, or is already redeemed
 */
export async function redeem(
  publicAddress: string,
  program: Program,
): Promise<PunchCard> {
  const card = getPunchCard(publicAddress, program.id)

  if (!card) {
    throw new Error("No punch card found.")
  }

  if (card.punches < card.requiredPunches) {
    throw new Error(`Card not complete. ${card.requiredPunches - card.punches} punches remaining.`)
  }

  if (card.status === "redeemed") {
    throw new Error("Card already redeemed.")
  }

  const mnemonic = getStoredMnemonic()
  if (!mnemonic) {
    throw new Error("Wallet mnemonic not available. Please log in again.")
  }

  const expirationDays = program.expirationDays
  if (expirationDays === undefined) {
    throw new Error("Program is missing expirationDays - cannot redeem punch card")
  }

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)

  // Build 14-field OP_RETURN array using builder
  // Pass the final punch count and program metadata
  const redeemSchema = buildPunchCardRedeemTransaction(
    program.id,
    program.name || "Unnamed Program",
    card.punches,
    expirationDays
  )
  
  // Extract the 14-field array from schema object
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
    senderAddress: publicAddress,
    senderPrivKeyWif: privKeyWif,
    outputs: [],
    opReturn: {
      data: redeemTx,
    },
  })

  // Update local state
  card.status = "redeemed"
  card.redeemedAt = new Date().toISOString()
  card.completionTxId = result.txId
  card.updatedAt = card.redeemedAt

  savePunchCard(card, publicAddress)
  invalidateOnChainCache(program.id)

  return card
}

/**
 * Backward-compatible redeemPunchCard function.
 * @deprecated Use redeem() instead
 */
export function redeemPunchCard(publicAddress: string, programId: string): PunchCard | null {
  const card = getPunchCard(publicAddress, programId)
  if (!card || card.punches < card.requiredPunches) return null

  card.status = "redeemed"
  card.redeemedAt = new Date().toISOString()
  card.updatedAt = card.redeemedAt
  savePunchCard(card, publicAddress)
  return card
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isPunchCardExpired(card: PunchCard, currentBlockHeight: number): boolean {
  if (!card.expirationBlockHeight) return false
  return currentBlockHeight >= card.expirationBlockHeight
}

export function getRemainingPunches(card: PunchCard): number {
  return Math.max(0, card.requiredPunches - card.punches)
}

export function getCompletionPercentage(card: PunchCard): number {
  return Math.min(100, Math.round((card.punches / card.requiredPunches) * 100))
}