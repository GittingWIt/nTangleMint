// Wallet configuration
export const WALLET_CONFIG = {
  NETWORK: "mainnet",
  DEFAULT_FEE: 0.5,
  MIN_BALANCE: 0.001,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  // From the comprehensive file
  WALLET_DATA: "walletData",
  WALLET_TYPE_PREFIX: "wallet_type_",
  PROGRAMS: "programs",
  USER_PARTICIPATION: "user_participation",
  NAVIGATION_LOCK: "navigation_lock",

  // Keep the original keys for backward compatibility
  WALLET: "ntanglemint_wallet",
  PROGRAMS_LEGACY: "ntanglemint_programs",
  NAV_LOCK: "ntanglemint_nav_lock",
  WALLET_TYPE_PREFIX_LEGACY: "ntanglemint_wallet_type_",
} as const

// Storage events
export const STORAGE_EVENTS = {
  // From the comprehensive file
  PROGRAM_CREATED: "program:created",
  PROGRAM_UPDATED: "program:updated",
  PROGRAM_DELETED: "program:deleted",
  STORAGE_ERROR: "storage:error",
  STORAGE_SYNC: "storage:sync",

  // Keep the original event names for backward compatibility
  WALLET_UPDATED: "walletUpdated",
  PROGRAMS_UPDATED: "programsUpdated",
} as const

// API endpoints
export const API_ENDPOINTS = {
  WALLET: "/api/wallet",
  PROGRAMS: "/api/programs",
  TRANSACTIONS: "/api/transactions",
} as const

// Program types
export const PROGRAM_TYPES = {
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

// Public paths
export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/test-bsv",
  "/test-bsv/lifecycle-test",
  "/test-bsv/comprehensive-test",
  "/test-bsv/single-test",
  "/wallet-generation",
  "/wallet-restoration",
] as const

// Merchant paths
export const MERCHANT_PATHS = [
  "/merchant",
  "/merchant/dashboard",
  "/merchant/create-program",
  "/merchant/create-program/punch-card",
  "/merchant/create-program/points",
  "/merchant/create-program/tiered",
  "/merchant/create-program/coalition",
  "/merchant/create-program/coupon-book",
] as const

// Helper function to get the appropriate storage key based on environment
export function getStorageKey(key: keyof typeof STORAGE_KEYS): string {
  const prefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_prod_"

  // Map the key to the appropriate storage key with prefix
  switch (key) {
    case "WALLET_DATA":
      return prefix + "wallet"
    case "PROGRAMS":
      return prefix + "programs"
    case "NAVIGATION_LOCK":
      return prefix + "nav_lock"
    case "WALLET_TYPE_PREFIX":
      return prefix + "wallet_type_"
    default:
      // For other keys, just return the value
      return STORAGE_KEYS[key]
  }
}