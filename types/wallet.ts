/**
 * Wallet type definitions
 */

export type WalletType = "customer" | "merchant"

export interface WalletData {
  publicAddress: string
  privateKey: string
  mnemonic: string
  type: WalletType
  businessName?: string
  createdAt: string
  updatedAt: string
  [key: string]: any // Allow additional properties for flexibility
}

export interface WalletCreationData {
  mnemonic: string
  type: WalletType
  businessName?: string
}

export interface WalletRestoreData {
  mnemonic: string
  type?: WalletType // Optional during restore, will be inferred
}

// Utility type guards
export function isValidWalletType(type: string): type is WalletType {
  return type === "customer" || type === "merchant"
}

export function isCustomerWallet(wallet: WalletData): boolean {
  return wallet.type === "customer"
}

export function isMerchantWallet(wallet: WalletData): boolean {
  return wallet.type === "merchant"
}

// Default wallet data structure
export function createDefaultWalletData(
  publicAddress: string,
  privateKey: string,
  mnemonic: string,
  type: WalletType = "customer",
  businessName?: string,
): WalletData {
  return {
    publicAddress,
    privateKey,
    mnemonic,
    type,
    ...(businessName !== undefined ? { businessName } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}