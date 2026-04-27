/**
 * Wallet Types
 *
 * Single authoritative source for all wallet-related types in nTangleMint.
 *
 * On-chain identity record (OP_RETURN written once at wallet creation):
 *   nTangleMint | WALLET | v1 | {walletID} | reserved1-10
 *
 * walletID format: wid_{12-char-base36} — fixed 16 chars total.
 * 
 * NOTE: walletType removed from on-chain format.
 * Users now have unified wallets supporting both creator and user capabilities.
 * UI controls feature visibility, not wallet type.
 */

// ============================================================================
// Core Primitives
// ============================================================================

export interface WalletBalance {
  address: string
  confirmed: number
  unconfirmed: number
  total: number
}

// ============================================================================
// Unified Wallet Data
// All users have the same wallet structure supporting both roles.
// ============================================================================

export interface Wallet {
  /** Unique wallet identifier. Format: wid_{12-char-base36}. Fixed 16 chars. */
  walletID: string
  /** BSV public address derived from mnemonic via BIP44 m/44'/0'/0'/0/0 */
  publicAddress: string
  /** WIF-encoded private key — kept in session only, never persisted to disk */
  privateKey: string
  /** BIP39 12-word mnemonic — kept in session only, never persisted to disk */
  mnemonic: string
  /** Current balance from blockchain */
  balance?: WalletBalance
  /** ISO timestamp of last activity */
  lastActiveAt?: string
  /** ISO timestamp of wallet creation */
  createdAt: string
}

// ============================================================================
// Session
// ============================================================================

export interface WalletSession {
  wallet: Wallet
  sessionToken?: string
  expiresAt?: string
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a default wallet data object.
 * walletID must always be provided — known at creation time.
 */
export function createDefaultWalletData(
  walletID: string,
  publicAddress: string,
  privateKey: string,
  mnemonic: string
): Wallet {
  return {
    walletID,
    publicAddress,
    privateKey,
    mnemonic,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Validate that a string conforms to the walletID format: wid_{12-char-base36}.
 */
export function isValidWalletID(value: string): boolean {
  return /^wid_[0-9a-z]{12}$/.test(value)
}

/**
 * Validate that a string conforms to the programID format: pid_{12-char-base36}.
 */
export function isValidProgramID(value: string): boolean {
  return /^pid_[0-9a-z]{12}$/.test(value)
}