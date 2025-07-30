// Centralized types for wallet generation
export const WALLET_TYPES = {
  CUSTOMER: "customer",
  MERCHANT: "merchant",
} as const

export type WalletType = (typeof WALLET_TYPES)[keyof typeof WALLET_TYPES]

// Business-specific metadata structure
export interface BSVWalletMetadata {
  transactionId: string
  timestamp: string
  walletType: WalletType
  businessName: string // Always string, empty if not applicable
  version: string
  features?: string[]
}

export interface WalletValidationResult {
  isValid: boolean
  detectedType: WalletType | null
  bsvMetadata?: BSVWalletMetadata
  testedResults: Array<{
    type: string
    success: boolean
    address?: string
  }>
  error?: string
}

export interface WalletData {
  mnemonic?: string
  publicAddress: string
  type: WalletType
  metadataTransactionId: string // Always string
  businessName: string // Always string, empty if not applicable
}

export interface CreateWalletResult {
  success: boolean
  wallet?: WalletData
  error?: string
}

export interface RestoreWalletResult {
  success: boolean
  wallet?: WalletData
  detectedType?: WalletType
  bsvMetadata?: BSVWalletMetadata
  error?: string
}

export interface ValidateMnemonicResult {
  success: boolean
  validation?: WalletValidationResult
  error?: string
}

// Basic BSV operations
export interface BSVTransaction {
  txId: string
  data: string
}

export interface BSVWalletGeneration {
  address: string
  privateKey: string
  mnemonic: string
}