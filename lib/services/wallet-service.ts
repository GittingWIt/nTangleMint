/**
 * Wallet Service
 *
 * Handles wallet session management, address derivation, and mnemonic operations.
 * Uses BIP39 for mnemonic generation and @bsv/sdk for BIP44 key derivation.
 *
 * All wallets are unified with both creator and participant capabilities.
 * Identity is blockchain-native (publicAddress derived from private key).
 */

import type { Wallet, WalletBalance } from "@/lib/types/wallet"
import { getNetworkMode, getAddressBalance, isValidAddress } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import * as bip39 from "bip39"
import { HD } from "@bsv/sdk"

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
 * Generate a unique Program ID in format: pid_{12-char-base36}
 * Uses random base36 characters for immutable on-chain identification
 */
export function generateProgramID(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz"
  let id = ""
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * 36))
  }
  return `pid_${id}`
}

// ============================================================================
// Mnemonic Generation & Validation
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
 * 
 * @param mnemonic - BIP39 mnemonic phrase
 * @param password - Optional password for additional security
 * @returns BSV public address (blockchain identity)
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

  // childKey.privKey is already a PrivateKey object with toAddress() method
  const address = childKey.privKey.toAddress(isTestnet ? [0x6f] : [0x00])

  return address.toString()
}

/**
 * Derive WIF-encoded private key from mnemonic using BIP44 path.
 * Used by transaction-service for signing transactions.
 * 
 * @param mnemonic - BIP39 mnemonic phrase
 * @param password - Optional password for additional security
 * @returns WIF-encoded private key
 */
export function getPrivKeyWif(mnemonic: string, password: string = ""): string {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase")
  }

  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic, password)
  const seed = Array.from(seedBuffer)
  const masterKey = HD.fromSeed(seed)
  const childKey = masterKey.derive(BIP44_PATH)

  if (!childKey.privKey) {
    throw new Error("Failed to derive child private key")
  }

  // The childKey.privKey is already a PrivateKey instance with toWif() method
  return childKey.privKey.toWif()
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Save wallet to session storage.
 * Credentials are stored in memory only, never persisted to disk.
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
 * Removes all wallet data from memory.
 */
export function logout(): void {
  safeSessionStorage.removeItem(WALLET_SESSION_KEY)
  safeSessionStorage.removeItem(MNEMONIC_TEMP_KEY)
  safeSessionStorage.removeItem(PASSWORD_TEMP_KEY)
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
// Balance Management
// ============================================================================

/**
 * Refresh wallet balance from the blockchain and persist updated wallet to session.
 * 
 * @param wallet - Current wallet object
 * @returns Updated wallet with latest balance
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
  } catch (error) {
    console.error("[wallet-service] Error refreshing balance:", error)
    return wallet
  }
}

// ============================================================================
// Program Recovery Integration
// ============================================================================

/**
 * Populate wallet with creator and participant programs from blockchain.
 * Used after wallet creation or restoration to sync on-chain program data.
 * 
 * @param wallet - Wallet to populate
 * @returns Wallet with populated creator and participant programs
 */
export async function populateWalletPrograms(wallet: Wallet): Promise<Wallet> {
  let creatorPrograms = wallet.creatorPrograms || []
  let participantPrograms = wallet.participantPrograms || []

  try {
    const { getProgramsByCreatorOnChain } = await import("./onchain-state-service")
    creatorPrograms = await getProgramsByCreatorOnChain(wallet.publicAddress)
  } catch (error) {
    console.warn("[populateWalletPrograms] Could not fetch creator programs:", error)
  }

  try {
    const { getPunchCardsByParticipantOnChain } = await import("./onchain-state-service")
    participantPrograms = await getPunchCardsByParticipantOnChain(wallet.publicAddress)
  } catch (error) {
    console.warn("[populateWalletPrograms] Could not fetch participant programs:", error)
  }

  const updatedWallet: Wallet = {
    ...wallet,
    creatorPrograms,
    participantPrograms,
  }

  saveWallet(updatedWallet)
  return updatedWallet
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