/**
 * Wallet Service
 *
 * Handles wallet session management, address derivation, and ID generation.
 * Uses bip39 for mnemonic generation and @bsv/sdk for key derivation.
 *
 * ID FORMAT (fixed 16 chars, scalable to 36^12 ~4.7 trillion unique values):
 *   walletID:  wid_{12-char-base36}  e.g. wid_a1b2c3d4e5f6
 *   programID: pid_{12-char-base36}  e.g. pid_x9y8z7w6v5u4
 *
 * All wallets are unified with both user and creator capabilities.
 * Dashboard controls what features are visible, not wallet type.
 */

import type { Wallet, WalletBalance } from "@/lib/types/wallet"
import { getNetworkMode, getAddressBalance, isValidAddress } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import * as bip39 from "bip39"
import { HD, PrivateKey } from "@bsv/sdk"

// ============================================================================
// Constants
// ============================================================================

const WALLET_SESSION_KEY = "wallet_session"
const MNEMONIC_TEMP_KEY = "ntanglemint_mnemonic_temp"
const PASSWORD_TEMP_KEY = "ntanglemint_password_temp"

// BIP44 derivation path for BSV
const BIP44_PATH = "m/44'/0'/0'/0/0"

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Internal utility: generates a fixed-length base36 random string of n characters.
 * Base36 = [0-9a-z], providing sufficient entropy with a compact, URL-safe format.
 */
function randomBase36(length: number): string {
  let result = ""
  while (result.length < length) {
    // Math.random() gives 0-1; converting to base36 gives variable length,
    // so we slice and loop until we have exactly `length` characters.
    result += Math.random().toString(36).substring(2)
  }
  return result.substring(0, length)
}

/**
 * Generate a unique wallet ID.
 * Format: wid_{12-char-base36} — fixed 16 chars total.
 * All wallets receive a walletID at creation.
 */
export function generateWalletID(): string {
  return `wid_${randomBase36(12)}`
}

/**
 * Generate a unique program ID.
 * Format: pid_{12-char-base36} — fixed 16 chars total.
 * Generated at program creation time; broadcast to blockchain at activation.
 */
export function generateProgramID(): string {
  return `pid_${randomBase36(12)}`
}

// ============================================================================
// Mnemonic
// ============================================================================

/**
 * Generate a random BIP39 mnemonic phrase (12 words, 128 bits of entropy).
 */
export async function generateMnemonic(): Promise<string> {
  const mnemonic = bip39.generateMnemonic(128)
  return mnemonic
}

/**
 * Validate a BIP39 mnemonic phrase.
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic)
}

// ============================================================================
// Key & Address Derivation
// ============================================================================

/**
 * Derive a BSV address from a BIP39 mnemonic using BIP44 path m/44'/0'/0'/0/0.
 * Uses @bsv/sdk HD key derivation.
 */
export function deriveAddress(mnemonic: string, password: string = ""): string {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase")
  }

  const networkMode = getNetworkMode()
  const isTestnet = networkMode === "testnet"

  // Derive seed from mnemonic (bip39 handles PBKDF2 + salt)
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic, password)
  const seed = Array.from(seedBuffer)

  // HD derivation via @bsv/sdk
  const masterKey = HD.fromSeed(seed)
  const childKey = masterKey.derive(BIP44_PATH)

  if (!childKey.privKey) {
    throw new Error("Failed to derive child private key")
  }

  const privKey = childKey.privKey
  const address = privKey.toAddress(isTestnet ? [0x6f] : [0x00])

  return address.toString()
}

/**
 * Derive WIF-encoded private key from mnemonic using the same BIP44 path.
 * Used by transaction-service for signing transactions.
 */
export function getPrivKeyWif(mnemonic: string, password: string = ""): string {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase")
  }

  const networkMode = getNetworkMode()
  const isTestnet = networkMode === "testnet"

  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic, password)
  const seed = Array.from(seedBuffer)
  const masterKey = HD.fromSeed(seed)
  const childKey = masterKey.derive(BIP44_PATH)

  if (!childKey.privKey) {
    throw new Error("Failed to derive child private key")
  }

  return childKey.privKey.toWif()
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Save wallet to session storage.
 */
export function saveWallet(wallet: Wallet): void {
  safeSessionStorage.setJSON(WALLET_SESSION_KEY, wallet)
}

/**
 * Get wallet from session storage.
 */
export function getCurrentWallet(): Wallet | null {
  return safeSessionStorage.getJSON<Wallet>(WALLET_SESSION_KEY)
}

/**
 * Clear wallet session (logout).
 */
export function logout(): void {
  safeSessionStorage.removeItem(WALLET_SESSION_KEY)
}

/**
 * Get temporarily stored mnemonic (used during wallet creation/restore flow).
 */
export function getStoredMnemonic(): string | null {
  return safeSessionStorage.getItem(MNEMONIC_TEMP_KEY)
}

/**
 * Get temporarily stored password (used during wallet creation/restore flow).
 */
export function getStoredPassword(): string {
  return safeSessionStorage.getItem(PASSWORD_TEMP_KEY) || ""
}

// ============================================================================
// Balance
// ============================================================================

/**
 * Refresh wallet balance from the blockchain and persist updated wallet to session.
 */
export async function refreshWalletBalance(wallet: Wallet): Promise<Wallet> {
  try {
    const balanceData = await getAddressBalance(wallet.publicAddress)

    if (!balanceData) {
      return wallet
    }

    const updatedBalance: WalletBalance = {
      address: wallet.publicAddress,
      confirmed: balanceData.confirmed,
      unconfirmed: balanceData.unconfirmed,
      total: balanceData.total,
    }

    const updatedWallet: Wallet = {
      ...wallet,
      balance: updatedBalance,
      lastActiveAt: new Date().toISOString(),
    }

    saveWallet(updatedWallet)
    return updatedWallet
  } catch {
    return wallet
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a BSV wallet address is valid.
 */
export function isWalletAddressValid(address: string): boolean {
  return isValidAddress(address)
}