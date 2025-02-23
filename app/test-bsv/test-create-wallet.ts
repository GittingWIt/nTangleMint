import { generateMnemonic, validateMnemonic } from "@/lib/bsv/mnemonic"
import { generateWallet } from "@/lib/bsv/wallet"

interface TestResult {
  entropy?: {
    buffer: number[]
    length: number
    isValid: boolean
  }
  mnemonic?: {
    value: string
    wordCount: number
    isValid: boolean
  }
  wallet?: {
    type: "user" | "merchant"
    hasPublicAddress: boolean
    hasPrivateKey: boolean
    hasPublicKey: boolean
  }
  validation?: {
    validMnemonic: boolean
    invalidMnemonic: boolean
  }
  error?: string | null
  success: boolean
  debug?: any
}

export async function testCreateWallet(type: "user" | "merchant" = "user"): Promise<TestResult> {
  const results: TestResult = {
    success: false,
    debug: {},
  }

  try {
    // Test entropy generation
    const testEntropy = () => {
      if (typeof window === "undefined") {
        throw new Error("Browser environment required")
      }

      const buffer = new Uint8Array(16)
      window.crypto.getRandomValues(buffer)
      return {
        buffer: Array.from(buffer),
        length: buffer.length,
        isValid: buffer.some((b) => b !== 0),
      }
    }

    results.entropy = testEntropy()
    results.debug.entropy = results.entropy
    console.log("[Test] Entropy generation successful:", results.entropy)

    // Test mnemonic generation
    try {
      const mnemonic = await generateMnemonic()
      results.mnemonic = {
        value: mnemonic,
        wordCount: mnemonic.split(" ").length,
        isValid: validateMnemonic(mnemonic),
      }
      results.debug.mnemonic = {
        firstWord: mnemonic.split(" ")[0],
        wordCount: results.mnemonic.wordCount,
        isValid: results.mnemonic.isValid,
      }
      console.log("[Test] Mnemonic generation successful:", results.debug.mnemonic)
    } catch (mnemonicError) {
      console.error("[Test] Mnemonic generation failed:", mnemonicError)
      throw mnemonicError
    }

    // Test wallet creation with detailed error handling
    try {
      console.log("[Test] Starting wallet creation with type:", type)
      const wallet = await generateWallet(undefined, type)
      console.log("[Test] Wallet creation result:", {
        type: wallet.type,
        hasPrivateKey: !!wallet.privateKey,
        hasPublicKey: !!wallet.publicKey,
        hasAddress: !!wallet.publicAddress,
      })

      if (!wallet || !wallet.type || !wallet.publicAddress) {
        throw new Error("Invalid wallet data returned")
      }

      results.wallet = {
        type: wallet.type,
        hasPublicAddress: !!wallet.publicAddress,
        hasPrivateKey: !!wallet.privateKey,
        hasPublicKey: !!wallet.publicKey,
      }
      results.debug.wallet = {
        type: wallet.type,
        publicAddressLength: wallet.publicAddress?.length,
        keys: {
          hasPrivateKey: !!wallet.privateKey,
          hasPublicKey: !!wallet.publicKey,
          hasAddress: !!wallet.publicAddress,
        },
      }
      console.log("[Test] Wallet creation successful:", results.debug.wallet)
    } catch (walletError) {
      console.error("[Test] Wallet creation failed:", walletError)
      results.debug.walletError = walletError instanceof Error ? walletError.message : String(walletError)
      throw walletError
    }

    // Test mnemonic validation
    results.validation = {
      validMnemonic: validateMnemonic(results.mnemonic!.value),
      invalidMnemonic: validateMnemonic("invalid mnemonic phrase test"),
    }
    console.log("[Test] Validation tests completed:", results.validation)

    results.success = true
  } catch (error) {
    console.error("[Test] Error during wallet creation test:", error)
    results.error = error instanceof Error ? error.message : "Unknown error"
    results.debug.error = error
    results.success = false
  }

  return results
}

export async function testWalletCreationFlow() {
  const results = {
    user: await testCreateWallet("user"),
    merchant: await testCreateWallet("merchant"),
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