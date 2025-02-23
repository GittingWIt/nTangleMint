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
} as const

// API endpoints
export const API_ENDPOINTS = {
  WALLET: "/api/wallet",
  PROGRAMS: "/api/programs",
  TRANSACTIONS: "/api/transactions",
} as const

// Program types
export const PROGRAM_TYPES = {
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