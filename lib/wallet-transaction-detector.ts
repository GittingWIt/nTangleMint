import { mnemonicToSeedSync } from "@scure/bip39"
import { BlockchainDataReader } from "./blockchain-native-architecture"

/**
 * SIMPLIFIED Wallet Transaction Detector
 * Uses blockchain-native architecture only
 */

async function deriveAllAddresses(mnemonic: string, password: string): Promise<{ customer: string; merchant: string }> {
  try {
    const normalizedMnemonic = mnemonic.toLowerCase().trim()
    const seedUint8Array = mnemonicToSeedSync(normalizedMnemonic, password || "")
    const seedBuffer = Buffer.from(seedUint8Array)

    const { deriveKeysFromSeed } = await import("@/lib/bsv/wallet")

    const customerKeys = await deriveKeysFromSeed(seedBuffer, "customer", !!password)
    const merchantKeys = await deriveKeysFromSeed(seedBuffer, "merchant", !!password)

    return {
      customer: customerKeys.address,
      merchant: merchantKeys.address,
    }
  } catch (error) {
    console.error("[Transaction Detector] Failed to derive addresses:", error)
    throw error
  }
}

export async function detectWalletTypeFromTransactions(
  mnemonic: string,
  password: string,
): Promise<"customer" | "merchant" | null> {
  try {
    console.log("[Transaction Detector] 🔍 Reading from blockchain...")

    const addresses = await deriveAllAddresses(mnemonic, password)
    console.log("[Transaction Detector] Generated addresses:", addresses)

    // Check customer first
    const customerType = await BlockchainDataReader.getWalletTypeFromBlockchain(addresses.customer)
    if (customerType === "customer") {
      console.log(`[Transaction Detector] ✅ Found CUSTOMER wallet`)
      return "customer"
    }

    // Check merchant
    const merchantType = await BlockchainDataReader.getWalletTypeFromBlockchain(addresses.merchant)
    if (merchantType === "merchant") {
      console.log(`[Transaction Detector] ✅ Found MERCHANT wallet`)
      return "merchant"
    }

    console.log("[Transaction Detector] 📝 No blockchain metadata found - new wallet")
    return null
  } catch (error) {
    console.error("[Transaction Detector] Detection failed:", error)
    return null
  }
}