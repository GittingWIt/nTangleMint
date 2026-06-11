/**
 * Wallet Types - nTangleMint
 *
 * Single authoritative source for all wallet-related types.
 * Identity is blockchain-native: publicAddress is the universal identifier.
 *
 * Creator/Participant status determined by blockchain transaction context:
 * - Creator: Wallet signed a "Create" transaction for a program (on-chain)
 * - Participant: Wallet signed "nTangle"/"nProcess"/"Redeem" transactions (on-chain)
 *
 * All users have unified wallets supporting both capabilities.
 * UI controls feature visibility, not wallet type.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * WalletBalance: Current on-chain balance state
 */
export interface WalletBalance {
  address: string
  confirmed: number
  unconfirmed: number
  total: number
}

/**
 * Wallet: Complete unified wallet (creator + participant capabilities)
 *
 * Identity is blockchain-native via publicAddress (BSV address).
 * All wallets support both creating programs and joining existing ones.
 */
export interface Wallet {
  /** BSV public address (primary identifier, blockchain-native) */
  publicAddress: string
  /** WIF-encoded private key — kept in session only, never persisted to disk */
  privateKey: string
  /** BIP39 12-word mnemonic — kept in session only, never persisted to disk */
  mnemonic: string
  /** Current balance from blockchain */
  balance?: WalletBalance
  /** Programs this wallet created (creator status via Create transactions on-chain) */
  creatorPrograms?: any[]
  /** Programs this wallet joined (participant status via nTangle/nProcess/Redeem transactions on-chain) */
  participantPrograms?: any[]
  /** ISO timestamp of last activity */
  lastActiveAt?: string
  /** ISO timestamp of wallet creation */
  createdAt: string
}

/**
 * WalletSession: Active user session with wallet
 */
export interface WalletSession {
  wallet: Wallet
  sessionToken?: string
  expiresAt?: string
}