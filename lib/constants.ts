// Wallet configuration
export const WALLET_CONFIG = {
  NETWORK: "mainnet",
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
} as const

// Storage events
export const STORAGE_EVENTS = {
  PROGRAM_CREATED: "program:created",
  PROGRAM_UPDATED: "program:updated",
  PROGRAM_DELETED: "program:deleted",
  STORAGE_ERROR: "storage:error",
  STORAGE_SYNC: "storage:sync",
  WALLET_UPDATED: "walletUpdated", // Keep the existing event name for backward compatibility
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