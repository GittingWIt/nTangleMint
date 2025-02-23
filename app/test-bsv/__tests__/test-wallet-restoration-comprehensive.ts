import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { clearWalletData } from "@/lib/storage"

interface RestorationTestCase {
  description: string
  type: "user" | "merchant"
  password?: string
}

interface RestorationTestResult {
  success: boolean
  testCase: RestorationTestCase
  originalAddress?: string
  restoredAddress?: string
  error?: string
  debug?: {
    mnemonic: string
    mnemonicsMatch: boolean
    typesMatch: boolean
  }
}

interface ComprehensiveTestResult {
  success: boolean
  mnemonic: string
  results: RestorationTestResult[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    storageConsistency: boolean
    addressConsistency: boolean
    addressUniqueness: boolean
    passwordEffectiveness: boolean
    typeEffectiveness: boolean
  }
  error?: string
}

export async function runSingleRestorationTest(
  mnemonic: string,
  testCase: RestorationTestCase,
): Promise<RestorationTestResult> {
  const result: RestorationTestResult = {
    success: false,
    testCase,
  }

  try {
    console.log(`[Test] Starting single restoration test for ${testCase.description}`)
    await clearWalletData()
    console.log("[Test] Cleared initial wallet data")

    // Create original wallet with provided mnemonic
    console.log("[Test] Creating original wallet")
    const originalWallet = await generateWallet(testCase.password, testCase.type)
    result.originalAddress = originalWallet.publicAddress
    console.log("[Test] Original wallet:", {
      type: originalWallet.type,
      address: originalWallet.publicAddress,
      mnemonic: originalWallet.mnemonic,
    })

    // Store original mnemonic for comparison
    const originalMnemonic = originalWallet.mnemonic

    // Clear wallet data before restoration
    await clearWalletData()
    console.log("[Test] Cleared wallet data for restoration")

    // Restore wallet using the SAME mnemonic
    console.log("[Test] Restoring wallet")
    const restoredWallet = await restoreWallet(originalMnemonic, testCase.password, testCase.type)
    result.restoredAddress = restoredWallet.publicAddress
    console.log("[Test] Restored wallet:", {
      type: restoredWallet.type,
      address: restoredWallet.publicAddress,
      mnemonic: restoredWallet.mnemonic,
    })

    result.success = result.originalAddress === result.restoredAddress
    result.debug = {
      mnemonic: originalMnemonic,
      mnemonicsMatch: originalMnemonic === restoredWallet.mnemonic,
      typesMatch: originalWallet.type === restoredWallet.type,
    }

    if (!result.success) {
      console.error("[Test] Address mismatch:", {
        original: result.originalAddress,
        restored: result.restoredAddress,
        mnemonicsMatch: result.debug.mnemonicsMatch,
        typesMatch: result.debug.typesMatch,
      })
    }
  } catch (error) {
    console.error("[Test] Error during test:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during test"
    result.success = false
  }

  return result
}

export async function runComprehensiveRestorationTest(): Promise<ComprehensiveTestResult> {
  const result: ComprehensiveTestResult = {
    success: false,
    mnemonic: "",
    results: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      storageConsistency: true,
      addressConsistency: true,
      addressUniqueness: true,
      passwordEffectiveness: true,
      typeEffectiveness: true,
    },
  }

  try {
    // Generate a single mnemonic to use across all tests
    result.mnemonic = await generateMnemonic()
    console.log("[Comprehensive Test] Generated mnemonic:", result.mnemonic)

    const testCases: RestorationTestCase[] = [
      { description: "User wallet without password", type: "user" },
      { description: "User wallet with password", type: "user", password: "testPassword123" },
      { description: "Merchant wallet without password", type: "merchant" },
      { description: "Merchant wallet with password", type: "merchant", password: "testPassword123" },
      { description: "User wallet with different password", type: "user", password: "differentPassword456" },
      { description: "Merchant wallet with different password", type: "merchant", password: "differentPassword456" },
    ]

    // Run all test cases with the same mnemonic
    for (const testCase of testCases) {
      console.log(`[Comprehensive Test] Running test case: ${testCase.description}`)
      const testResult = await runSingleRestorationTest(result.mnemonic, testCase)
      result.results.push(testResult)

      if (testResult.success) {
        result.summary.passedTests++
      } else {
        result.summary.failedTests++
      }
    }

    result.summary.totalTests = testCases.length

    // Analyze results for uniqueness and effectiveness
    const addresses = new Set<string>()
    const addressMap = new Map<string, string>()

    for (const testResult of result.results) {
      if (testResult.originalAddress) {
        if (addresses.has(testResult.originalAddress)) {
          result.summary.addressUniqueness = false
        }
        addresses.add(testResult.originalAddress)
        addressMap.set(
          `${testResult.testCase.type}-${testResult.testCase.password || "nopass"}`,
          testResult.originalAddress,
        )
      }

      // Check storage consistency
      if (!testResult.debug?.mnemonicsMatch || !testResult.debug?.typesMatch) {
        result.summary.storageConsistency = false
      }

      // Check address consistency
      if (testResult.originalAddress !== testResult.restoredAddress) {
        result.summary.addressConsistency = false
      }
    }

    // Check password effectiveness
    const userNoPass = addressMap.get("user-nopass")
    const userWithPass = addressMap.get("user-testPassword123")
    const merchantNoPass = addressMap.get("merchant-nopass")
    const merchantWithPass = addressMap.get("merchant-testPassword123")

    if (userNoPass === userWithPass || merchantNoPass === merchantWithPass) {
      result.summary.passwordEffectiveness = false
    }

    // Check type effectiveness
    if (userNoPass === merchantNoPass || userWithPass === merchantWithPass) {
      result.summary.typeEffectiveness = false
    }

    result.success =
      result.summary.failedTests === 0 &&
      result.summary.storageConsistency &&
      result.summary.addressConsistency &&
      result.summary.addressUniqueness &&
      result.summary.passwordEffectiveness &&
      result.summary.typeEffectiveness

    console.log("[Comprehensive Test] Test completed:", {
      success: result.success,
      summary: result.summary,
    })
  } catch (error) {
    console.error("[Comprehensive Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during comprehensive test"
    result.success = false
  }

  return result
}