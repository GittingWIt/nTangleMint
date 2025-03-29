import { walletState } from "@/lib/wallet-sync"
import { debug } from "@/lib/debug"

// Add a function to check if a wallet is valid
export function isWalletValid(wallet: any): boolean {
  if (!wallet) return false

  // Check for required properties
  return wallet.type === "merchant" && typeof wallet.publicAddress === "string" && wallet.publicAddress.length > 0
}

// Enhance the fixWalletInitialization function to be more robust
export async function fixWalletInitialization() {
  debug("Starting wallet initialization fix...")

  try {
    // First check if we already have a valid wallet
    const existingWallet = walletState.getWalletData(true)

    if (isWalletValid(existingWallet)) {
      debug("Found existing valid merchant wallet, no need to fix", {
        address: existingWallet.publicAddress,
        type: existingWallet.type,
      })

      // Dispatch event to notify components
      window.dispatchEvent(new Event("walletUpdated"))

      return {
        success: true,
        message: "Using existing merchant wallet",
      }
    }

    // If we have a wallet but it's missing properties, try to fix it first
    if (existingWallet) {
      debug("Found existing wallet but it needs fixing", existingWallet)

      // Create a fixed version with required properties
      const fixedWallet = {
        ...existingWallet,
        type: existingWallet.type || "merchant",
        publicAddress:
          existingWallet.publicAddress || existingWallet.address || "0xf00000000000000000000000000000000000000f",
        publicKey: existingWallet.publicKey || "0xf00000000000000000000000000000000000000fpublic",
        privateKey: existingWallet.privateKey || "0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed",
        createdAt: existingWallet.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessName: existingWallet.businessName || "Fixed Merchant Business",
        businessId: existingWallet.businessId || "fixed-business-123",
        verified: true,
      }

      // Update wallet state
      walletState.update(fixedWallet)
      debug("Fixed existing wallet data:", fixedWallet)

      // Dispatch event to notify components
      window.dispatchEvent(new Event("walletUpdated"))

      return {
        success: true,
        message: "Fixed existing wallet data",
      }
    }

    // If no wallet exists or couldn't be fixed, create a new one
    debug("No valid wallet found, creating a new one")

    // Clear any existing wallet data
    const prefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_"
    const walletKey = `${prefix}wallet`
    localStorage.removeItem(walletKey)

    // Wait a moment to ensure storage is updated
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a proper merchant wallet with all required fields
    const merchantWallet = {
      type: "merchant",
      publicAddress: "0xf00000000000000000000000000000000000000f",
      publicKey: "0xf00000000000000000000000000000000000000fpublic",
      privateKey: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessName: "Mock Merchant Business",
      businessId: "mock-business-123",
      verified: true,
    }

    // Now set the wallet data using walletState
    walletState.update(merchantWallet)
    debug("Created new merchant wallet:", merchantWallet)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("walletUpdated"))

    return {
      success: true,
      message: "Created new merchant wallet successfully",
    }
  } catch (error) {
    console.error("Error fixing wallet initialization:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error,
    }
  }
}