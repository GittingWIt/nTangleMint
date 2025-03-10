import type { WalletData, MerchantWalletData } from "@/types"

export function isMerchantWallet(wallet: WalletData): wallet is MerchantWalletData {
  if (wallet.type !== "merchant") return false

  const merchantWallet = wallet as MerchantWalletData
  return (
    typeof merchantWallet.businessName === "string" &&
    typeof merchantWallet.businessId === "string" &&
    typeof merchantWallet.verified === "boolean" &&
    merchantWallet.businessName.length > 0 &&
    merchantWallet.businessId.length > 0
  )
}

export function validateMerchantWallet(wallet: WalletData): { isValid: boolean; error?: string } {
  if (!wallet) {
    return { isValid: false, error: "No wallet data found" }
  }

  if (wallet.type !== "merchant") {
    return { isValid: false, error: "Not a merchant wallet" }
  }

  if (!isMerchantWallet(wallet)) {
    return { isValid: false, error: "Invalid merchant wallet structure" }
  }

  if (!wallet.verified) {
    return { isValid: false, error: "Merchant wallet not verified" }
  }

  return { isValid: true }
}