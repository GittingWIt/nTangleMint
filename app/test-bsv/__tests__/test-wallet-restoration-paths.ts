import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { mnemonicToSeedSync } from "@scure/bip39"
import { deriveKeysFromSeed } from "@/lib/bsv/wallet"
import { clearWalletData } from "@/lib/storage"

interface WalletRestorationPathTest {
  mnemonic: string
  tests: {
    type: "user" | "merchant"
    password?: string
    paths: {
      path: string
      originalAddress: string
      restoredAddress: string
      matches: boolean
    }[]
  }[]
  success: boolean
  error?: string
  details: {
    pathConsistency: boolean
    typeConsistency: boolean
    passwordProtection: boolean
    uniquePaths: boolean
  }
}

export async function testWalletRestorationPaths(): Promise<WalletRestorationPathTest> {
  const result: WalletRestorationPathTest = {
    mnemonic: "",
    tests: [],
    success: false,
    details: {
      pathConsistency: false,
      typeConsistency: false,
      passwordProtection: false,
      uniquePaths: false,
    },
  }

  try {
    // Generate test mnemonic
    result.mnemonic = await generateMnemonic()
    console.log("[Restoration Path Test] Generated mnemonic:", result.mnemonic)

    const testPaths = [
      "m/44'/236'/0'/0/0", // BSV specific
      "m/0'/0'/0'", // Hardened path
      "m/0/0/0", // Non-hardened path
    ]

    const testConfigs = [
      { type: "user" as const, password: undefined },
      { type: "user" as const, password: "testPassword123" },
      { type: "merchant" as const, password: undefined },
      { type: "merchant" as const, password: "testPassword123" },
    ]

    const bsv = await (await import("scrypt-ts")).bsv

    // Test each configuration
    for (const config of testConfigs) {
      console.log(`[Restoration Path Test] Testing ${config.type} wallet${config.password ? " with password" : ""}`)

      const testCase = {
        type: config.type,
        password: config.password,
        paths: [] as {
          path: string
          originalAddress: string
          restoredAddress: string
          matches: boolean
        }[],
      }

      // Generate original addresses
      const seed = mnemonicToSeedSync(result.mnemonic, config.password || "")

      for (const path of testPaths) {
        // Generate original address
        const { publicKey: originalPublicKey } = await deriveKeysFromSeed(seed, bsv, path)
        const originalAddress = originalPublicKey.toAddress().toString()

        // Clear wallet data
        await clearWalletData()

        // Generate restored address
        const restoredSeed = mnemonicToSeedSync(result.mnemonic, config.password || "")
        const { publicKey: restoredPublicKey } = await deriveKeysFromSeed(restoredSeed, bsv, path)
        const restoredAddress = restoredPublicKey.toAddress().toString()

        testCase.paths.push({
          path,
          originalAddress,
          restoredAddress,
          matches: originalAddress === restoredAddress,
        })
      }

      result.tests.push(testCase)
    }

    // Analyze results
    const allPathsMatch = result.tests.every((test) => test.paths.every((p) => p.matches))

    const uniqueAddressesPerTest = result.tests.every(
      (test) => new Set(test.paths.map((p) => p.originalAddress)).size === test.paths.length,
    )

    const typeConsistency = result.tests.every((test, _, tests) =>
      tests.some(
        (otherTest) =>
          test.type === otherTest.type &&
          test.password === otherTest.password &&
          test.paths.every((path, i) => path.originalAddress === otherTest.paths[i].originalAddress),
      ),
    )

    const passwordProtection = result.tests.some((test, _, tests) =>
      tests.some(
        (otherTest) =>
          test.type === otherTest.type &&
          test.password !== otherTest.password &&
          test.paths.some((path, i) => path.originalAddress !== otherTest.paths[i].originalAddress),
      ),
    )

    result.details = {
      pathConsistency: allPathsMatch,
      typeConsistency,
      passwordProtection,
      uniquePaths: uniqueAddressesPerTest,
    }

    result.success = allPathsMatch && uniqueAddressesPerTest

    console.log("[Restoration Path Test] Test completed:", {
      success: result.success,
      details: result.details,
    })
  } catch (error) {
    console.error("[Restoration Path Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during restoration path test"
    result.success = false
  }

  return result
}

export async function runWalletRestorationPathTest() {
  console.log("Starting wallet restoration path test...")
  return await testWalletRestorationPaths()
}