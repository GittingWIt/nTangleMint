import type { WalletData } from "@/types"

export const mockMerchantWallet: WalletData = {
  mnemonic: "test test test test test test test test test test test test",
  privateKey: "KzYsQDNWH9BsyXHDe7LYXPRNZdNVmgCfvTsDJTkARWd4wzu8MLVN",
  publicKey: "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  publicAddress: "1MerchantWalletAddressExample123456",
  type: "merchant",
  businessName: "Test Merchant",
  businessId: "TEST123",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}