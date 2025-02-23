import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { clearWalletData } from "@/lib/storage"

interface WalletLifecycleTest {
  success: boolean
  error?: string
  originalWallet: {
    type: "user" | "merchant"
    mnemonic: string
    publicAddress: string
    hasPassword: boolean
  }
  restoredWallet: {
    publicAddress: string
    matches: boolean
  }
  details: {
    addressMatch: boolean
    typePreserved: boolean
    passwordProtected: boolean
  }
}

export async function testWalletLifecycleFlow(
  type: "user" | "merchant" = "user",
  password?: string,
): Promise<WalletLifecycleTest> {
  const result: WalletLifecycleTest = {
    success: false,
    originalWallet: {
      type,
      mnemonic: "",
      publicAddress: "",
      hasPassword: !!password,
    },
    restoredWallet: {
      publicAddress: "",
      matches: false,
    },
    details: {
      addressMatch: false,
      typePreserved: false,
      passwordProtected: false,
    },
  }

  try {
    // Step 1: Create new wallet
    console.log(`[Lifecycle Test] Creating new ${type} wallet${password ? " with password" : ""}`)
    const originalWallet = await generateWallet(password, type)

    result.originalWallet.mnemonic = originalWallet.mnemonic
    result.originalWallet.publicAddress = originalWallet.publicAddress

    // Step 2: Clear wallet data (simulate logout)
    console.log("[Lifecycle Test] Clearing wallet data")
    await clearWalletData()

    // Step 3: Restore wallet
    console.log("[Lifecycle Test] Restoring wallet")
    const restoredWallet = await restoreWallet(originalWallet.mnemonic, password, type)

    result.restoredWallet.publicAddress = restoredWallet.publicAddress
    result.restoredWallet.matches = restoredWallet.publicAddress === originalWallet.publicAddress

    // Step 4: Verify results
    result.details = {
      addressMatch: result.restoredWallet.matches,
      typePreserved: restoredWallet.type === originalWallet.type,
      passwordProtected: password
        ? // If password was provided, verify a different password produces different address
          (await restoreWallet(originalWallet.mnemonic, "wrong" + password, type)).publicAddress !==
          originalWallet.publicAddress
        : true,
    }

    result.success = result.details.addressMatch && result.details.typePreserved && result.details.passwordProtected

    console.log("[Lifecycle Test] Test completed:", {
      success: result.success,
      details: result.details,
    })
  } catch (error) {
    console.error("[Lifecycle Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during lifecycle test"
    result.success = false
  }

  return result
}

export async function runWalletLifecycleFlowTest() {
  console.log("Starting wallet lifecycle flow test...")

  const results = {
    user: {
      noPassword: await testWalletLifecycleFlow("user"),
      withPassword: await testWalletLifecycleFlow("user", "testPassword123"),
    },
    merchant: {
      noPassword: await testWalletLifecycleFlow("merchant"),
      withPassword: await testWalletLifecycleFlow("merchant", "testPassword123"),
    },
  }

  const success = Object.values(results).every((typeResults) =>
    Object.values(typeResults).every((result) => result.success),
  )

  return {
    success,
    results,
  }
}