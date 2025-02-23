import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { clearWalletData } from "@/lib/storage"
import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"

interface PasswordDerivationTestResult {
  mnemonic: string
  tests: {
    password: string | undefined
    original: {
      privateKey: string
      publicKey: string
      address: string
    }
    restorations: {
      attempt: number
      privateKey: string
      publicKey: string
      address: string
      matches: boolean
    }[]
  }[]
  success: boolean
  error?: string
  details?: {
    consistentWithPassword: boolean
    consistentWithoutPassword: boolean
    passwordAffectsDerivedKeys: boolean
  }
}

export async function testPasswordDerivation(attempts = 3): Promise<PasswordDerivationTestResult> {
  const result: PasswordDerivationTestResult = {
    mnemonic: "",
    tests: [],
    success: false,
  }

  try {
    // Generate a new mnemonic for testing
    result.mnemonic = await generateMnemonic()
    console.log("[Password Test] Generated test mnemonic:", result.mnemonic)

    // Test cases with different passwords
    const testCases = [
      undefined, // No password
      "password123", // Simple password
      "Complex!@#$%^&*()", // Complex password
    ]

    for (const password of testCases) {
      console.log(`[Password Test] Testing with password: ${password || "undefined"}`)

      // Clear any existing data
      await clearWalletData()

      // Generate initial wallet with current password
      const originalWallet = await generateWallet(password, "merchant")
      const originalMnemonic = originalWallet.mnemonic // Store the original mnemonic

      console.log("[Password Test] Original wallet created:", {
        mnemonic: originalMnemonic.split(" ")[0] + "...",
        address: originalWallet.publicAddress,
      })

      const testCase = {
        password,
        original: {
          privateKey: originalWallet.privateKey,
          publicKey: originalWallet.publicKey,
          address: originalWallet.publicAddress,
        },
        restorations: [],
      }

      // Multiple restoration attempts using the original mnemonic
      for (let i = 0; i < attempts; i++) {
        console.log(`[Password Test] Restoration attempt ${i + 1}/${attempts}`)

        // Clear data before each attempt
        await clearWalletData()

        // Restore wallet with original mnemonic and same password
        const restoredWallet = await restoreWallet(originalMnemonic, password, "merchant")

        const matches =
          restoredWallet.privateKey === originalWallet.privateKey &&
          restoredWallet.publicKey === originalWallet.publicKey &&
          restoredWallet.publicAddress === originalWallet.publicAddress

        testCase.restorations.push({
          attempt: i + 1,
          privateKey: restoredWallet.privateKey,
          publicKey: restoredWallet.publicKey,
          address: restoredWallet.publicAddress,
          matches,
        })

        if (!matches) {
          console.error("[Password Test] Key mismatch:", {
            original: {
              mnemonic: originalMnemonic.split(" ")[0] + "...",
              privateKey: originalWallet.privateKey.substring(0, 10),
              address: originalWallet.publicAddress,
            },
            restored: {
              privateKey: restoredWallet.privateKey.substring(0, 10),
              address: restoredWallet.publicAddress,
            },
          })
        }
      }

      result.tests.push(testCase)
    }

    // Analyze results
    const withoutPasswordTest = result.tests.find((t) => t.password === undefined)
    const withPasswordTest = result.tests.find((t) => t.password === "password123")

    result.details = {
      consistentWithPassword: withPasswordTest?.restorations.every((r) => r.matches) ?? false,
      consistentWithoutPassword: withoutPasswordTest?.restorations.every((r) => r.matches) ?? false,
      passwordAffectsDerivedKeys: withPasswordTest?.original.address !== withoutPasswordTest?.original.address,
    }

    result.success = result.details.consistentWithPassword && result.details.consistentWithoutPassword

    console.log("[Password Test] Test completed:", {
      success: result.success,
      details: result.details,
    })
  } catch (error) {
    console.error("[Password Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during password derivation test"
    result.success = false
  }

  return result
}

export async function runPasswordDerivationTest() {
  console.log("Starting password derivation test...")
  const result = await testPasswordDerivation()

  // Create readable output
  const output = {
    success: result.success,
    mnemonic: result.mnemonic,
    tests: result.tests.map((test) => ({
      password: test.password ? "***" : "undefined",
      originalAddress: test.original.address,
      restorations: test.restorations.map((r) => ({
        attempt: r.attempt,
        address: r.address,
        matches: r.matches,
      })),
    })),
    details: result.details,
    error: result.error,
  }

  console.log("Password derivation test result:", JSON.stringify(output, null, 2))
  return output
}