import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { getStoredWalletType, clearWalletData } from "@/lib/storage"

interface TestResult {
  originalWallet?: {
    mnemonic: string
    publicAddress: string
    type: "user" | "merchant"
    privateKey: string
    publicKey: string
  }
  restoredWallet?: {
    publicAddress: string
    type: "user" | "merchant"
    privateKey: string
    publicKey: string
    matchesOriginal: boolean
  }
  storedType?: {
    type: "user" | "merchant" | null
    matchesOriginal: boolean
  }
  multipleRestores?: {
    attempts: number
    allAddressesMatch: boolean
    addresses: string[]
  }
  error?: string | null
  success: boolean
  debug?: any
}

export async function testRestoreWallet(type: "user" | "merchant" = "user"): Promise<TestResult> {
  const results: TestResult = {
    success: false,
    debug: {},
  }

  try {
    console.log("[Test Restore] Starting wallet restoration test for type:", type)

    // Clear any existing wallet data
    await clearWalletData()

    // First, generate a new wallet to get a valid mnemonic
    console.log("[Test Restore] Generating original wallet")
    const originalWallet = await generateWallet(undefined, type)

    // Make sure mnemonic exists before proceeding
    if (!originalWallet.mnemonic) {
      throw new Error("Generated wallet is missing mnemonic phrase")
    }

    // Store original wallet data
    results.originalWallet = {
      mnemonic: originalWallet.mnemonic, // Now we know this is not undefined
      publicAddress: originalWallet.publicAddress,
      type: originalWallet.type,
      privateKey: originalWallet.privateKey,
      publicKey: originalWallet.publicKey,
    }

    console.log("[Test Restore] Original wallet created:", {
      type: originalWallet.type,
      publicAddress: originalWallet.publicAddress,
    })

    // Clear wallet data before restoration
    await clearWalletData()

    // Verify stored wallet type
    const storedType = await getStoredWalletType(originalWallet.mnemonic)
    results.storedType = {
      type: storedType,
      matchesOriginal: storedType === type,
    }
    console.log("[Test Restore] Stored wallet type:", storedType)

    // Test multiple restore attempts
    const RESTORE_ATTEMPTS = 3
    const restoredAddresses: string[] = []
    let allMatch = true

    for (let i = 0; i < RESTORE_ATTEMPTS; i++) {
      console.log(`[Test Restore] Attempt ${i + 1}/${RESTORE_ATTEMPTS}`)

      // Clear data before each attempt
      await clearWalletData()

      // Restore wallet
      const restoredWallet = await restoreWallet(originalWallet.mnemonic, undefined, type)
      restoredAddresses.push(restoredWallet.publicAddress)

      // Check if this attempt matches original
      if (restoredWallet.publicAddress !== originalWallet.publicAddress) {
        allMatch = false
        console.error("[Test Restore] Address mismatch:", {
          original: originalWallet.publicAddress,
          restored: restoredWallet.publicAddress,
        })
      }

      // On first attempt, store detailed results
      if (i === 0) {
        results.restoredWallet = {
          publicAddress: restoredWallet.publicAddress,
          type: restoredWallet.type,
          privateKey: restoredWallet.privateKey,
          publicKey: restoredWallet.publicKey,
          matchesOriginal: restoredWallet.publicAddress === originalWallet.publicAddress,
        }
      }
    }

    results.multipleRestores = {
      attempts: RESTORE_ATTEMPTS,
      allAddressesMatch: allMatch,
      addresses: restoredAddresses,
    }

    // Verify final state
    if (!allMatch) {
      throw new Error("Inconsistent address generation across restore attempts")
    }

    if (results.restoredWallet?.publicAddress !== originalWallet.publicAddress) {
      throw new Error("Restored wallet address does not match original")
    }

    if (results.restoredWallet?.type !== originalWallet.type) {
      throw new Error("Restored wallet type does not match original")
    }

    results.success = true
    results.debug = {
      originalAddress: originalWallet.publicAddress,
      restoredAddresses: restoredAddresses,
      originalType: originalWallet.type,
      restoredType: results.restoredWallet?.type,
      storedType,
      keyDerivation: {
        originalPrivateKeyStart: originalWallet.privateKey.substring(0, 10),
        restoredPrivateKeyStart: results.restoredWallet?.privateKey.substring(0, 10),
        keysMatch: originalWallet.privateKey === results.restoredWallet?.privateKey,
      },
    }
  } catch (error) {
    console.error("[Test Restore] Error during wallet restoration test:", error)
    results.error = error instanceof Error ? error.message : "Unknown error"
    results.debug.error = error
    results.success = false
  }

  return results
}

export async function testFullRestoreFlow() {
  const results = {
    user: await testRestoreWallet("user"),
    merchant: await testRestoreWallet("merchant"),
  }

  return {
    success: results.user.success && results.merchant.success,
    results,
    debug: {
      user: results.user.debug,
      merchant: results.merchant.debug,
    },
  }
}