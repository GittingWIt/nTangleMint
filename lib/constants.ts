// nTangleMint OP_RETURN Format - Phase 7 Architecture
// Core field structure (Fields 0-4) defined in lib/constants/core-field-positions.ts & core-schema.ts
// Program-type-specific structure (Fields 5-8) defined in lib/constants/punchcard-field-positions.ts & punchcard-schema.ts
// Supports extensibility for new program types (Loyalty, Coupon) without core changes
export const NTANGLEMINT_FORMAT_VERSION = "v1"

// Bitcoin dust limit - minimum output value to be spendable
export const BITCOIN_DUST_LIMIT = 546 // satoshis

// Program configuration - SINGLE SOURCE OF TRUTH
export const PROGRAM_DEFAULTS = {
  SATOSHIS_PER_PUNCH: 500,       // Cost per punch transaction (standardized name)
  TOTAL_PUNCH_BLOCKS: 6,          // Default number of punches required
  EXPIRATION_DAYS: 365,           // Default program expiration
  PREVIEW_BLOCK_CONFIRMATIONS: 6, // Blocks required for transaction confirmation
} as const

// Wallet configuration
export const WALLET_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet",
  DEFAULT_FEE: 0.5,
  MIN_BALANCE: 0.001,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_DATA: "walletData",
  WALLET_TYPE_PREFIX: "wallet_type_",
  PROGRAMS: "programs",
  USER_PARTICIPATION: "user_participation",
  NAVIGATION_LOCK: "navigation_lock",
  MINTEREST: "minterest",
  PUNCH_CARDS: "punch_cards",
} as const

// Storage events
export const STORAGE_EVENTS = {
  PROGRAM_CREATED: "program:created",
  PROGRAM_UPDATED: "program:updated",
  PROGRAM_DELETED: "program:deleted",
  STORAGE_ERROR: "storage:error",
  STORAGE_SYNC: "storage:sync",
  WALLET_UPDATED: "walletUpdated",
  PROGRAMS_UPDATED: "programsUpdated",
  MINTEREST_UPDATED: "minterestUpdated",
} as const

// API endpoints
export const API_ENDPOINTS = {
  WALLET: "/api/wallet",
  PROGRAMS: "/api/programs",
  TRANSACTIONS: "/api/transactions",
} as const

// ============================================================================
// Program & Transaction Types - nTangleMint OP_RETURN Format
// ============================================================================

/**
 * Program Types - First field in OP_RETURN (Field 1)
 * Identifies the class/category of program (extensible for future types)
 * Used in blockchain records for program classification
 */
export const PROGRAM_TYPES = {
  PUNCH_CARD: "PunchCard",
  // Future types: COUPON, LOYALTY, SUBSCRIPTION, etc.
} as const

export type ProgramType = typeof PROGRAM_TYPES[keyof typeof PROGRAM_TYPES]

/**
 * Transaction Types - Second field in OP_RETURN (Field 2)
 * Identifies the specific action being recorded on blockchain
 * Used with Program Type to determine OP_RETURN field structure
 */
export const TRANSACTION_TYPES = {
  CREATE: "Create",       // Program registration / card creation
  NTANGLE: "nTangle",     // First punch / participant joins
  NPROCESS: "nProcess",   // Subsequent punch / accumulation
  REDEEM: "Redeem",       // Final punch / reward claim
  DELETE: "Delete",       // Program deletion / removal
} as const

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]

/**
 * Legacy application-level program types (for UI/UX differentiation)
 * These are NOT stored in OP_RETURN - kept separate for app logic
 */
export const APPLICATION_PROGRAM_TYPES = {
  COUPON_BOOK: "coupon-book",
  PUNCH_CARD: "punch-card",
  POINTS: "points",
  TIERED: "tiered",
  COALITION: "coalition",
} as const

// NFT configuration
export const NFT_CONFIG = {
  DEFAULT_ASPECT_RATIO: "2:1",
  DEFAULT_BORDER_RADIUS: "0.5rem",
  MAX_LAYERS: 5,
} as const

// Public paths (no wallet required)
export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/wallet",
] as const

// Customer paths
export const CUSTOMER_PATHS = [
  "/customer",
] as const

// Program management paths (unified, no merchant distinction)
export const PROGRAM_PATHS = [
  "/create-program",
  "/programs",
  "/programs/new",
] as const

// Helper function to get the appropriate storage key based on environment
export function getStorageKey(key: keyof typeof STORAGE_KEYS): string {
  const prefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_"

  switch (key) {
    case "WALLET_DATA":
      return prefix + "wallet"
    case "PROGRAMS":
      return prefix + "programs"
    case "NAVIGATION_LOCK":
      return prefix + "nav_lock"
    case "WALLET_TYPE_PREFIX":
      return prefix + "wallet_type_"
    case "MINTEREST":
      return prefix + "minterest"
    case "PUNCH_CARDS":
      return prefix + "punch_cards"
    default:
      return STORAGE_KEYS[key]
  }
}

// nTangleMint terminology
export const TERMINOLOGY = {
  MINTEREST: "Minterest",      // Saved program, off-chain bookmark
  NTANGLED: "nTangled",        // Event: first transaction, NFT created
  NPROCESS: "nProcess",        // State: actively earning punches
  REDEEMED: "Redeemed",        // Event/State: reward claimed
} as const