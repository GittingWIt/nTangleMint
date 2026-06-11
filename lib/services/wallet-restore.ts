/**
 * Wallet Restoration Service
 *
 * Restores a wallet from a BIP39 mnemonic by:
 *   1. Validating the mnemonic format
 *   2. Deriving the address and private key from the mnemonic using BIP44
 *   3. Querying blockchain for programs this wallet created (creator status)
 *   4. Querying blockchain for punch cards this wallet joined (participant status)
 *
 * All wallets are unified with both creator and participant capabilities.
 * Identity is blockchain-native (derived from TX signature).
 */

import type { Wallet } from "@/lib/types"
import { getAddressBalance } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import {
  deriveAddress,
  validateMnemonic,
  getPrivKeyWif,
  saveWallet,
} from "./wallet-service"

// ============================================================================
// Wallet Restoration
// ============================================================================

/**
 * Restore a wallet from a BIP39 mnemonic.
 *
 * Uses BIP44 derivation path (m/44'/0'/0'/0/0) for BSV compatibility.
 * Queries blockchain to populate creator programs and participant punch cards.
 * Returns a fully functional Wallet object with all discovered programs.
 *
 * @param mnemonic - BIP39 mnemonic phrase (12 words)
 * @param password - Optional password for mnemonic encryption
 * @returns Restored Wallet with creator and participant programs
 */
export async function restoreWallet(
  mnemonic: string,
  password: string = "",
): Promise<Wallet> {
  // Validate mnemonic format
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase")
  }

  // Derive address and private key from mnemonic using BIP44
  const publicAddress = deriveAddress(mnemonic, password)
  const privateKey = getPrivKeyWif(mnemonic, password)

  // Recover programs CREATED by this wallet (creator status)
  let creatorPrograms: any[] = []
  try {
    const { getProgramsByCreatorOnChain } = await import("./onchain-state-service")
    creatorPrograms = await getProgramsByCreatorOnChain(publicAddress)
  } catch (error) {
    // Program recovery optional - wallet will function without recovered programs
    console.warn("[restoreWallet] Could not fetch creator programs:", error)
  }

  // Recover programs this wallet JOINED (participant status - punch cards)
  let participantPrograms: any[] = []
  try {
    const { getPunchCardsByParticipantOnChain } = await import("./onchain-state-service")
    participantPrograms = await getPunchCardsByParticipantOnChain(publicAddress)
  } catch (error) {
    // Participant program recovery optional
    console.warn("[restoreWallet] Could not fetch participant programs:", error)
  }

  const now = new Date().toISOString()

  // Fetch balance from blockchain (non-blocking, defaults to zero)
  const balance = await getAddressBalance(publicAddress).catch(() => null)

  // Reconstruct wallet object — unified structure for all users
  const wallet: Wallet = {
    publicAddress,
    privateKey,
    mnemonic,
    balance: balance
      ? { address: publicAddress, ...balance }
      : { address: publicAddress, confirmed: 0, unconfirmed: 0, total: 0 },
    creatorPrograms: creatorPrograms || [],
    participantPrograms: participantPrograms || [],
    createdAt: now,
    lastActiveAt: now,
  }

  // Persist credentials to session (never to disk)
  safeSessionStorage.setItem("ntanglemint_mnemonic_temp", mnemonic)
  safeSessionStorage.setItem("ntanglemint_password_temp", password)
  saveWallet(wallet)

  return wallet
}