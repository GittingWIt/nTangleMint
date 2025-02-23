import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { clearWalletData, setWalletData, getWalletData, debugStorage } from "@/lib/storage"
import type { WalletData } from "@/types"

interface WalletLifecycleTestResult {
  original: {
    mnemonic: string
    privateKey: string
    publicKey: string
    address: string
  }
  restorations: {
    attempt: number
    privateKey: string
    publicKey: string
    address: string
    matchesOriginal: boolean
  }[]
  storageTests: {
    attempt: number
    beforeReload: {
      privateKey: string
      address: string
    }
    afterReload: {
      privateKey: string
      address: string
    }
    consistent: boolean
  }[]
  success: boolean
  error?: string
  debug?: {
    storageState?: any
    validationErrors?: string[]
  }
}

async function simulateStorageReload(wallet: WalletData): Promise<WalletData | null> {
  try {
    // Clear all data first
    await clearWalletData()

    // Store the wallet
    await setWalletData(wallet)

    // Debug storage state
    debugStorage()

    // Clear runtime cache
    const storedData = localStorage.getItem("walletData")
    localStorage.clear()

    // Restore the wallet data only
    if (storedData) {
      localStorage.setItem("walletData", storedData)
    }

    // Reload from storage
    return await getWalletData()
  } catch (error) {
    console.error("[Storage Reload] Error:", error)
    throw new Error(`Storage reload failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function testWalletLifecycle(attempts = 3): Promise<WalletLifecycleTestResult> {
  const result: WalletLifecycleTestResult = {
    original: {
      mnemonic: "",
      privateKey: "",
      publicKey: "",
      address: "",
    },
    restorations: [],
    storageTests: [],
    success: false,
    debug: {
      validationErrors: [],
    },
  }

  try {
    console.log("[Lifecycle Test] Starting wallet lifecycle test")

    // Step 1: Generate initial wallet
    const initialWallet = await generateWallet(undefined, "merchant")
    result.original = {
      mnemonic: initialWallet.mnemonic,
      privateKey: initialWallet.privateKey,
      publicKey: initialWallet.publicKey,
      address: initialWallet.publicAddress,
    }

    console.log("[Lifecycle Test] Initial wallet generated:", {
      address: initialWallet.publicAddress,
      privateKey: `${initialWallet.privateKey.substring(0, 10)}...`,
    })

    // Step 2: Test multiple restorations
    for (let i = 0; i < attempts; i++) {
      console.log(`[Lifecycle Test] Restoration attempt ${i + 1}/${attempts}`)

      // Clear everything before each attempt
      await clearWalletData()

      // Restore wallet
      const restoredWallet = await restoreWallet(result.original.mnemonic, undefined, "merchant")

      const matchesOriginal =
        restoredWallet.privateKey === result.original.privateKey &&
        restoredWallet.publicKey === result.original.publicKey &&
        restoredWallet.publicAddress === result.original.address

      result.restorations.push({
        attempt: i + 1,
        privateKey: restoredWallet.privateKey,
        publicKey: restoredWallet.publicKey,
        address: restoredWallet.publicAddress,
        matchesOriginal,
      })

      if (!matchesOriginal) {
        result.debug?.validationErrors?.push(`Restoration mismatch on attempt ${i + 1}`)
        console.error("[Lifecycle Test] Restoration mismatch:", {
          original: {
            privateKey: `${result.original.privateKey.substring(0, 10)}...`,
            address: result.original.address,
          },
          restored: {
            privateKey: `${restoredWallet.privateKey.substring(0, 10)}...`,
            address: restoredWallet.publicAddress,
          },
        })
      }
    }

    // Step 3: Test storage persistence
    for (let i = 0; i < attempts; i++) {
      console.log(`[Lifecycle Test] Storage test attempt ${i + 1}/${attempts}`)

      // Generate new wallet for this test
      const testWallet = await generateWallet(undefined, "merchant")

      const beforeReload = {
        privateKey: testWallet.privateKey,
        address: testWallet.publicAddress,
      }

      // Capture storage state before reload
      debugStorage()
      result.debug!.storageState = { before: localStorage.getItem("walletData") }

      // Simulate page reload by clearing and reloading from storage
      const reloadedWallet = await simulateStorageReload(testWallet)

      // Capture storage state after reload
      result.debug!.storageState = {
        ...result.debug!.storageState,
        after: localStorage.getItem("walletData"),
      }

      if (!reloadedWallet) {
        result.debug?.validationErrors?.push(`Failed to reload wallet on attempt ${i + 1}`)
        throw new Error("Failed to reload wallet from storage")
      }

      const afterReload = {
        privateKey: reloadedWallet.privateKey,
        address: reloadedWallet.publicAddress,
      }

      const consistent =
        beforeReload.privateKey === afterReload.privateKey && beforeReload.address === afterReload.address

      result.storageTests.push({
        attempt: i + 1,
        beforeReload,
        afterReload,
        consistent,
      })

      if (!consistent) {
        result.debug?.validationErrors?.push(`Storage inconsistency on attempt ${i + 1}`)
        console.error("[Lifecycle Test] Storage inconsistency:", {
          before: {
            privateKey: `${beforeReload.privateKey.substring(0, 10)}...`,
            address: beforeReload.address,
          },
          after: {
            privateKey: `${afterReload.privateKey.substring(0, 10)}...`,
            address: afterReload.address,
          },
        })
      }
    }

    // Check overall success
    const allRestorationsMatch = result.restorations.every((r) => r.matchesOriginal)
    const allStorageConsistent = result.storageTests.every((t) => t.consistent)
    result.success = allRestorationsMatch && allStorageConsistent

    console.log("[Lifecycle Test] Test completed:", {
      success: result.success,
      restorationSuccess: allRestorationsMatch,
      storageSuccess: allStorageConsistent,
      validationErrors: result.debug?.validationErrors,
    })
  } catch (error) {
    console.error("[Lifecycle Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during lifecycle test"
    result.success = false
  }

  return result
}

export async function runWalletLifecycleTest() {
  console.log("Starting wallet lifecycle test...")
  const result = await testWalletLifecycle()

  // Create readable output
  const output = {
    success: result.success,
    original: {
      privateKey: `${result.original.privateKey.substring(0, 10)}...`,
      address: result.original.address,
    },
    restorations: result.restorations.map((r) => ({
      attempt: r.attempt,
      privateKey: `${r.privateKey.substring(0, 10)}...`,
      address: r.address,
      matchesOriginal: r.matchesOriginal,
    })),
    storageTests: result.storageTests.map((t) => ({
      attempt: t.attempt,
      consistent: t.consistent,
      beforeReload: {
        privateKey: `${t.beforeReload.privateKey.substring(0, 10)}...`,
        address: t.beforeReload.address,
      },
      afterReload: {
        privateKey: `${t.afterReload.privateKey.substring(0, 10)}...`,
        address: t.afterReload.address,
      },
    })),
    error: result.error,
    debug: result.debug,
  }

  console.log("Wallet lifecycle test result:", JSON.stringify(output, null, 2))
  return output
}