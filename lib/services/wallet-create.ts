/**
 * Wallet Creation Service
 *
 * Creates new wallets locally with BIP39 mnemonic and BIP44 derivation.
 * Wallets can be used immediately without blockchain interaction.
 */

import type { Wallet } from "@/lib/types"
import { getAddressBalance } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import {
  deriveAddress,
  generateMnemonic,
  getPrivKeyWif,
  saveWallet,
} from "./wallet-service"

// ============================================================================
// Wallet Creation
// ============================================================================

/**
 * Create a new wallet.
 *
 * Generates BIP39 mnemonic, derives address via BIP44 (m/44'/0'/0'/0/0),
 * and saves to session storage. Wallet is immediately usable.
 *
 * @param password - Optional password for mnemonic encryption
 * @returns Wallet object and mnemonic phrase
 */
export async function createWallet(
  password: string = "",
): Promise<{ wallet: Wallet; mnemonic: string }> {
  const mnemonic = await generateMnemonic()
  const publicAddress = deriveAddress(mnemonic, password)
  const privateKey = getPrivKeyWif(mnemonic, password)
  const now = new Date().toISOString()

  // Fetch balance from blockchain (non-blocking)
  const balance = await getAddressBalance(publicAddress).catch(() => null)

  const wallet: Wallet = {
    publicAddress,
    privateKey,
    mnemonic,
    balance: balance
      ? { address: publicAddress, ...balance }
      : { address: publicAddress, confirmed: 0, unconfirmed: 0, total: 0 },
    createdAt: now,
    lastActiveAt: now,
  }

  // Persist credentials to session only (never to disk)
  saveWallet(wallet)
  safeSessionStorage.setItem("ntanglemint_mnemonic_temp", mnemonic)
  safeSessionStorage.setItem("ntanglemint_password_temp", password)

  return { wallet, mnemonic }
}