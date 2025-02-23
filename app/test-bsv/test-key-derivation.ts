import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { mnemonicToSeedSync } from "@scure/bip39"
import { clearWalletData } from "@/lib/storage"
import { deriveKeysFromSeed, restoreWallet } from "@/lib/bsv/wallet"

interface KeyDerivationTestResult {
  mnemonic: string
  seedHex: string
  derivedKeys: {
    privateKey: string
    publicKey: string
    address: string
  }[]
  restorationTest?: {
    privateKey: string
    publicKey: string
    address: string
    matchesDerivation: boolean
  }
  consistent: boolean
  success: boolean
  error?: string
  details?: {
    consistentPrivateKeys: boolean
    consistentPublicKeys: boolean
    consistentAddresses: boolean
    validPrivateKeyFormat: boolean
    validPublicKeyFormat: boolean
    validAddressFormat: boolean
    restorationMatchesDerivation: boolean
  }
}

function validateKeyFormats(keys: { privateKey: string; publicKey: string; address: string }): boolean {
  // Validate private key format (Base58Check, starts with K or L for compressed keys)
  const privateKeyRegex = /^[KL][1-9A-HJ-NP-Za-km-z]{51}$/

  // Validate public key format (hex string, 66 chars for compressed public keys)
  const publicKeyRegex = /^0[2-3][0-9A-Fa-f]{64}$/

  // Validate BSV address format (Base58Check, starts with 1)
  const addressRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/

  const isValidPrivate = privateKeyRegex.test(keys.privateKey)
  const isValidPublic = publicKeyRegex.test(keys.publicKey)
  const isValidAddress = addressRegex.test(keys.address)

  console.log("[Test] Key format validation:", {
    privateKey: { valid: isValidPrivate, value: keys.privateKey.substring(0, 10) + "..." },
    publicKey: { valid: isValidPublic, value: keys.publicKey.substring(0, 10) + "..." },
    address: { valid: isValidAddress, value: keys.address },
  })

  return isValidPrivate && isValidPublic && isValidAddress
}

export async function testKeyDerivation(attempts = 5, password?: string): Promise<KeyDerivationTestResult> {
  const result: KeyDerivationTestResult = {
    mnemonic: "",
    seedHex: "",
    derivedKeys: [],
    consistent: true,
    success: false,
    details: {
      consistentPrivateKeys: true,
      consistentPublicKeys: true,
      consistentAddresses: true,
      validPrivateKeyFormat: true,
      validPublicKeyFormat: true,
      validAddressFormat: true,
      restorationMatchesDerivation: true,
    },
  }

  try {
    // Clear any existing wallet data
    await clearWalletData()

    // Generate a new mnemonic
    result.mnemonic = await generateMnemonic()
    console.log("[Test] Generated mnemonic:", result.mnemonic)

    // Generate seed with password
    const seed = mnemonicToSeedSync(result.mnemonic, password || "")
    result.seedHex = Buffer.from(seed).toString("hex")
    console.log("[Test] Generated seed (first 8 chars):", result.seedHex.substring(0, 8))

    const bsv = await (await import("scrypt-ts")).bsv

    // Perform multiple key derivations
    for (let i = 0; i < attempts; i++) {
      console.log(`[Test] Direct derivation attempt ${i + 1}/${attempts}`)

      const { privateKey, publicKey } = await deriveKeysFromSeed(seed, bsv)
      const address = new bsv.Address(publicKey, "mainnet").toString()

      const derivedKey = {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        address,
      }

      // Validate key formats on first attempt
      if (i === 0) {
        const isValidFormat = validateKeyFormats(derivedKey)
        if (!isValidFormat) {
          throw new Error("Invalid key format detected in direct derivation")
        }
      }

      result.derivedKeys.push(derivedKey)

      // Check consistency with previous derivations
      if (i > 0) {
        if (
          result.derivedKeys[i].privateKey !== result.derivedKeys[0].privateKey ||
          result.derivedKeys[i].publicKey !== result.derivedKeys[0].publicKey ||
          result.derivedKeys[i].address !== result.derivedKeys[0].address
        ) {
          result.details!.consistentPrivateKeys = false
          result.details!.consistentPublicKeys = false
          result.details!.consistentAddresses = false
          console.error("[Test] Inconsistent derivation:", {
            first: {
              privateKey: result.derivedKeys[0].privateKey.substring(0, 10),
              address: result.derivedKeys[0].address,
            },
            current: {
              privateKey: result.derivedKeys[i].privateKey.substring(0, 10),
              address: result.derivedKeys[i].address,
            },
          })
          break
        }
      }
    }

    // Test wallet restoration with same mnemonic
    console.log("[Test] Testing full wallet restoration process")
    const restoredWallet = await restoreWallet(result.mnemonic, password, "merchant")
    result.restorationTest = {
      privateKey: restoredWallet.privateKey,
      publicKey: restoredWallet.publicKey,
      address: restoredWallet.publicAddress,
      matchesDerivation:
        restoredWallet.privateKey === result.derivedKeys[0].privateKey &&
        restoredWallet.publicKey === result.derivedKeys[0].publicKey &&
        restoredWallet.publicAddress === result.derivedKeys[0].address,
    }

    if (!result.restorationTest.matchesDerivation) {
      result.details!.restorationMatchesDerivation = false
      console.error("[Test] Restoration mismatch:", {
        derived: {
          privateKey: result.derivedKeys[0].privateKey.substring(0, 10),
          address: result.derivedKeys[0].address,
        },
        restored: {
          privateKey: restoredWallet.privateKey.substring(0, 10),
          address: restoredWallet.publicAddress,
        },
      })
    }

    // Update overall consistency and success flags
    result.consistent =
      result.details!.consistentPrivateKeys &&
      result.details!.consistentPublicKeys &&
      result.details!.consistentAddresses &&
      result.restorationTest.matchesDerivation
    result.success = result.consistent && validateKeyFormats(result.derivedKeys[0])

    console.log("[Test] Test completed:", {
      success: result.success,
      consistent: result.consistent,
      details: result.details,
    })
  } catch (error) {
    console.error("[Test] Error during key derivation test:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during key derivation test"
    result.success = false
    result.consistent = false
  }

  return result
}

export async function runKeyDerivationTest() {
  console.log("Starting enhanced key derivation test...")
  const result = await testKeyDerivation()

  // Create a more readable output
  const output = {
    success: result.success,
    consistent: result.consistent,
    mnemonic: result.mnemonic,
    seedHex: `${result.seedHex.substring(0, 16)}...`,
    derivedKeys: result.derivedKeys.map((key, index) => ({
      attempt: index + 1,
      privateKey: `${key.privateKey.substring(0, 10)}...`,
      publicKey: `${key.publicKey.substring(0, 10)}...`,
      address: key.address,
    })),
    restorationTest: result.restorationTest
      ? {
          consistent: result.restorationTest.matchesDerivation,
          privateKey: `${result.restorationTest.privateKey.substring(0, 10)}...`,
          publicKey: `${result.restorationTest.publicKey.substring(0, 10)}...`,
          address: result.restorationTest.address,
          matchesDerivation: result.restorationTest.matchesDerivation,
        }
      : undefined,
    details: result.details,
    error: result.error,
  }

  console.log("Key derivation test result:", JSON.stringify(output, null, 2))
  return output
}