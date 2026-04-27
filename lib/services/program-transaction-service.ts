/**
 * Program Transaction Service
 *
 * Broadcasts PROGRAM registration to the BSV blockchain.
 *
 * On-chain format: nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved1-7
 *
 * The new format includes essential recovery details directly in the OP_RETURN so programs
 * can be fully recovered from blockchain data without relying on localStorage.
 */

import { sendTransaction } from "./transaction-service"
import type { Program } from "@/lib/types"
import { NTANGLEMINT_FORMAT_VERSION } from "@/lib/constants"
import { invalidateOnChainCache } from "./onchain-state-service"

/**
 * Broadcast PROGRAM OP_RETURN to register a program on-chain.
 *
 * Format: nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved1-7
 *
 * Fields:
 *   0: nTangleMint (protocol identifier)
 *   1: PROGRAM (record type)
 *   2: {programID} (pid_xxxxxx)
 *   3: {walletID} (wid_xxxxxx)
 *   4: {programName} (URL-encoded)
 *   5: {reward} (URL-encoded reward description)
 *   6: {requiredPunches} (number of punches needed)
 *   7: {expirationDays} (days until program expires)
 *   8-14: reserved for future use
 */
export async function broadcastProgramRegistration(
  program: Program,
  merchantPrivKey: string,
  merchantAddress: string
): Promise<{ txId: string; txHex: string; fee: number }> {
  // Extract recovery details from program
  const programName = program.name || "Unnamed Program"
  const reward = program.metadata?.reward || "See program details"
  const requiredPunches = program.metadata?.requiredPunches || 6
  
  // Calculate expiration days from metadata if available
  let expirationDays = 365
  if (program.metadata?.expirationDate) {
    const expDate = new Date(program.metadata.expirationDate)
    const today = new Date()
    expirationDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Format: nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved1-7
  const opReturnFields = [
    "nTangleMint",
    "PROGRAM",
    program.id,
    program.walletID,
    encodeURIComponent(programName), // URL-encode to handle special characters
    encodeURIComponent(reward),      // URL-encode to handle special characters
    requiredPunches.toString(),
    expirationDays.toString(),
    "", // reserved1
    "", // reserved2
    "", // reserved3
    "", // reserved4
    "", // reserved5
    "", // reserved6
    "", // reserved7
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: merchantPrivKey,
    senderAddress: merchantAddress,
    outputs: [],
    opReturn: {
      data: opReturnFields,
    },
  })

  // Invalidate program cache so next query fetches fresh on-chain data
  invalidateOnChainCache(program.id)

  return result
}

/**
 * Query blockchain for all registered programs
 * 
 * This will search for all transactions with nTangleMint|PROGRAM OP_RETURN data
 * 
 * @returns Array of program IDs and their registration transactions
 */
export async function queryRegisteredPrograms(): Promise<
  Array<{
    programId: string
    txId: string
    blockHeight: number
    merchantAddress: string
    timestamp: string
  }>
> {
  // TODO: Implement blockchain query for nTangleMint|PROGRAM transactions
  // This will use WhatsOnChain API to search for OP_RETURN data
  // For now, return empty array (programs will still work from localStorage)
  console.log("[v0] Blockchain program query not yet implemented")
  return []
}

/**
 * Check if a program is registered on-chain
 * 
 * @param programId - Program ID to check
 * @returns True if program exists on blockchain
 */
export async function isProgramRegistered(programId: string): Promise<boolean> {
  const programs = await queryRegisteredPrograms()
  return programs.some((p) => p.programId === programId)
}