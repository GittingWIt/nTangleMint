/**
 * Send/Receive Transaction Service
 *
 * Handles wallet-to-wallet BSV transfers.
 * Uses transaction-service for building, signing, and broadcasting.
 */

import { sendTransaction, validateAddress } from "./transaction-service"
import { getStoredMnemonic, getStoredPassword, getPrivKeyWif } from "./wallet-service"

/**
 * Send BSV from sender wallet to a recipient address
 */
export async function sendBsv(params: {
  senderAddress: string
  recipientAddress: string
  amountInSatoshis: number
}): Promise<{ success: boolean; txId?: string; fee?: number; error?: string }> {
  const { senderAddress, recipientAddress, amountInSatoshis } = params

  try {
    // Validate recipient address
    if (!validateAddress(recipientAddress)) {
      return { success: false, error: "Invalid recipient address" }
    }

    if (amountInSatoshis <= 0) {
      return { success: false, error: "Amount must be greater than 0" }
    }

    // Derive signing key from stored mnemonic
    const mnemonic = getStoredMnemonic()
    if (!mnemonic) {
      return { success: false, error: "Wallet mnemonic not available. Please log in again." }
    }

    const password = getStoredPassword()
    const privKeyWif = getPrivKeyWif(mnemonic, password)

    // Build, sign, and broadcast
    const result = await sendTransaction({
      senderPrivKeyWif: privKeyWif,
      senderAddress,
      outputs: [
        {
          address: recipientAddress,
          satoshis: amountInSatoshis,
        },
      ],
    })

    return { success: true, txId: result.txId, fee: result.fee }
  } catch (error) {
    console.error("[SendReceive] Error sending BSV:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending BSV",
    }
  }
}

/**
 * Validate a BSV address
 */
export function validateBsvAddress(address: string): boolean {
  return validateAddress(address)
}