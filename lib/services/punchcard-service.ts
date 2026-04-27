/**
 * Punch Card Service
 *
 * Handles the complete punch card lifecycle on the BSV blockchain:
 *
 *   nTangled  - First purchase, NFT minted to customer wallet, card created at punches=1
 *   nProcess  - Each subsequent punch, increments count
 *   Redeemed  - Final punch, reward claimed, program complete for this customer
 *
 * On-chain OP_RETURN formats (extensible, no versioning):
 *   nTangleMint | nTangled  | {programID} | {customerWalletID} | reserved1-7
 *   nTangleMint | nProcess  | {programID} | {customerWalletID} | reserved1-7
 *   nTangleMint | Redeemed  | {programID} | {customerWalletID} | reserved1-7
 *
 * Unique key for a punch card: programID + customerWalletID
 * PunchID = txId of the nTangled transaction (immutable on-chain proof)
 */

import type { Program, PunchCard, PunchCardStatus } from "@/lib/types"
import { getPunchCardsByCustomer, savePunchCard, getPunchCardByProgramId } from "./storage-service"
import { sendTransaction } from "./transaction-service"
import { getStoredMnemonic, getStoredPassword, getPrivKeyWif } from "./wallet-service"
import { invalidateOnChainCache } from "./onchain-state-service"

// ============================================================================
// Punch Card Queries
// ============================================================================

export function getActivePunchCards(customerAddress: string): PunchCard[] {
  const cards = getPunchCardsByCustomer(customerAddress)
  return cards.filter(card => card.status === "active")
}

export function getCompletedPunchCards(customerAddress: string): PunchCard[] {
  const cards = getPunchCardsByCustomer(customerAddress)
  return cards.filter(card => card.status === "redeemed")
}

export function getPunchCard(customerAddress: string, programId: string): PunchCard | null {
  return getPunchCardByProgramId(customerAddress, programId)
}

export { getPunchCardByProgramId } from "./storage-service"

export function hasPunchCard(customerAddress: string, programId: string): boolean {
  return getPunchCardByProgramId(customerAddress, programId) !== null
}

/**
 * Count unique customers who have joined a program
 */
export function getParticipantCountForProgram(programId: string): number {
  const storageKey = `punchcards_${programId}`
  const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
  if (!stored) return 0

  try {
    const cards: PunchCard[] = JSON.parse(stored)
    const uniqueCustomers = new Set(cards.map(card => card.customerAddress))
    return uniqueCustomers.size
  } catch {
    return 0
  }
}

// ============================================================================
// nTangled - First Purchase (NFT Mint)
// ============================================================================

/**
 * Create a punch card via nTangled transaction.
 *
 * This is the NFT mint event - the customer's first purchase creates the card.
 * OP_RETURN: nTangleMint | nTangled | {programID} | {customerWalletID} | reserved1-7
 *
 * @param program - The program being joined
 * @param customerAddress - Customer's BSV address
 * @param customerWalletID - Customer's walletID (wid_{12-char-base36})
 */
export async function nTangle(
  program: Program,
  customerAddress: string,
  customerWalletID: string,
): Promise<PunchCard> {
  if (!program?.merchantAddress) {
    throw new Error("Invalid program or missing merchant address")
  }

  if (!customerWalletID) {
    throw new Error("Customer walletID is required for nTangled transaction")
  }

  // Prevent merchant from joining their own program
  if (customerAddress === program.merchantAddress) {
    throw new Error("Program creators cannot join their own program. Use 'Manage' to administer the program.")
  }

  const mnemonic = getStoredMnemonic()
  if (!mnemonic) {
    throw new Error("Wallet mnemonic not available. Please log in again.")
  }

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)

  const satoshisPerPunch = program.metadata?.satoshisPerPunch
  if (!satoshisPerPunch) {
    throw new Error("Program is missing satoshisPerPunch - cannot create punch card")
  }

  // nTangled OP_RETURN: nTangleMint | nTangled | {programID} | {customerWalletID} | reserved1-7
  const opReturnFields = [
    "nTangleMint",
    "nTangled",
    program.id,
    customerWalletID,
    "", // reserved1
    "", // reserved2
    "", // reserved3
    "", // reserved4
    "", // reserved5
    "", // reserved6
    "", // reserved7
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: privKeyWif,
    senderAddress: customerAddress,
    outputs: [
      {
        address: program.merchantAddress,
        satoshis: satoshisPerPunch,
      },
    ],
    opReturn: {
      data: opReturnFields,
    },
  })

  const now = new Date().toISOString()
  const requiredPunches = program.metadata?.requiredPunches || 6

  const punchCard: PunchCard = {
    txId: result.txId, // txId IS the PunchID - immutable on-chain proof
    programId: program.id,
    program,
    walletID: customerWalletID,
    customerAddress,
    merchantAddress: program.merchantAddress,
    punches: 1, // nTangled starts at 1
    requiredPunches,
    reward: program.metadata?.reward || "Reward",
    createdAt: now,
    updatedAt: now,
    status: "active",
  }

  savePunchCard(punchCard)
  invalidateOnChainCache(program.id)

  return punchCard
}

// Backward-compatible alias
export const createPunchCard = nTangle

// ============================================================================
// nProcess - Subsequent Punches
// ============================================================================

/**
 * Process a subsequent punch via nProcess transaction.
 *
 * OP_RETURN: nTangleMint | nProcess | {programID} | {customerWalletID} | reserved1-7
 *
 * @param customerAddress - Customer's BSV address
 * @param customerWalletID - Customer's walletID
 * @param program - The program
 */
export async function nProcess(
  customerAddress: string,
  customerWalletID: string,
  program: Program,
): Promise<{ txId: string; punchCard: PunchCard }> {
  const existingCard = getPunchCard(customerAddress, program.id)

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

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)
  const satoshisPerPunch = program.metadata?.satoshisPerPunch || 1000

  // Check if this punch will complete the card
  const willComplete = (existingCard.punches + 1) >= existingCard.requiredPunches

  // nProcess OP_RETURN: nTangleMint | nProcess | {programID} | {customerWalletID} | reserved1-7
  const opReturnFields = [
    "nTangleMint",
    "nProcess",
    program.id,
    customerWalletID,
    "", // reserved1
    "", // reserved2
    "", // reserved3
    "", // reserved4
    "", // reserved5
    "", // reserved6
    "", // reserved7
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: privKeyWif,
    senderAddress: customerAddress,
    outputs: willComplete
      ? [] // No payment on final punch (reward punch)
      : [{ address: program.merchantAddress, satoshis: satoshisPerPunch }],
    opReturn: {
      data: opReturnFields,
    },
  })

  // Update local state
  existingCard.punches += 1
  existingCard.updatedAt = new Date().toISOString()

  // Check for BOGO instant completion or standard completion
  const isBOGO = program.metadata?.programType === "bogo"
  const shouldComplete = isBOGO || existingCard.punches >= existingCard.requiredPunches

  if (shouldComplete) {
    existingCard.status = "active" // Still active until Redeemed
  }

  savePunchCard(existingCard)
  invalidateOnChainCache(program.id)

  return { txId: result.txId, punchCard: existingCard }
}

// Backward-compatible alias
export const processPunchTransaction = nProcess

// Legacy addPunch function (delegates to nProcess)
export async function addPunch(
  customerAddress: string,
  programId: string,
  program: Program
): Promise<PunchCard | null> {
  const card = getPunchCard(customerAddress, programId)
  if (!card) return null

  // Need walletID - get from existing card
  const result = await nProcess(customerAddress, card.walletID, program)
  return result.punchCard
}

// ============================================================================
// Redeemed - Reward Claimed
// ============================================================================

/**
 * Redeem a completed punch card via Redeemed transaction.
 *
 * OP_RETURN: nTangleMint | Redeemed | {programID} | {customerWalletID} | reserved1-7
 *
 * This marks the program as complete for this customer.
 */
export async function redeem(
  customerAddress: string,
  customerWalletID: string,
  program: Program,
): Promise<PunchCard> {
  const card = getPunchCard(customerAddress, program.id)

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

  const password = getStoredPassword()
  const privKeyWif = getPrivKeyWif(mnemonic, password)

  // Redeemed OP_RETURN: nTangleMint | Redeemed | {programID} | {customerWalletID} | reserved1-7
  const opReturnFields = [
    "nTangleMint",
    "Redeemed",
    program.id,
    customerWalletID,
    "", // reserved1
    "", // reserved2
    "", // reserved3
    "", // reserved4
    "", // reserved5
    "", // reserved6
    "", // reserved7
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: privKeyWif,
    senderAddress: customerAddress,
    outputs: [], // No payment on redemption - just OP_RETURN
    opReturn: {
      data: opReturnFields,
    },
  })

  // Update local state
  card.status = "redeemed"
  card.redeemedAt = new Date().toISOString()
  card.updatedAt = card.redeemedAt

  savePunchCard(card)
  invalidateOnChainCache(program.id)

  return card
}

// Backward-compatible alias
export function redeemPunchCard(customerAddress: string, programId: string): PunchCard | null {
  const card = getPunchCard(customerAddress, programId)
  if (!card || card.punches < card.requiredPunches) return null

  // Sync version for backward compat - just updates local state
  card.status = "redeemed"
  card.redeemedAt = new Date().toISOString()
  card.updatedAt = card.redeemedAt
  savePunchCard(card)
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