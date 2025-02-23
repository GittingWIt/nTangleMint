import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { mnemonicToSeedSync } from "@scure/bip39"
import { deriveKeysFromSeed } from "@/lib/bsv/wallet"

export interface DerivationPathTestResult {
  mnemonic: string
  seedHex: string
  paths: {
    path: string
    hardened: boolean
    derived: {
      privateKey: string
      publicKey: string
      address: string
    }
    consistent: boolean
    attempts: {
      attempt: number
      privateKey: string
      publicKey: string
      address: string
      matchesFirst: boolean
    }[]
  }[]
  success: boolean
  error?: string
  details?: {
    consistentDerivation: boolean
    pathAffectsKeys: boolean
    hardenedVsNonHardened: {
      keysMatch: boolean
      addressesMatch: boolean
    }
  }
}

export async function testDerivationPaths(attempts = 3): Promise<DerivationPathTestResult> {
  const result: DerivationPathTestResult = {
    mnemonic: "",
    seedHex: "",
    paths: [],
    success: false,
  }

  try {
    // Generate test mnemonic
    result.mnemonic = await generateMnemonic()
    console.log("[Derivation Test] Generated mnemonic:", result.mnemonic)

    // Generate seed
    const seed = mnemonicToSeedSync(result.mnemonic)
    result.seedHex = Buffer.from(seed).toString("hex")
    console.log("[Derivation Test] Generated seed (first 8 chars):", result.seedHex.substring(0, 8))

    // Test different derivation paths
    const testPaths = [
      { path: "m/44'/236'/0'/0/0", hardened: true }, // BSV specific
      { path: "m/0'/0'/0'", hardened: true }, // Hardened path
      { path: "m/0/0/0", hardened: false }, // Non-hardened path
      { path: "m/44'/0'/0'/0/0", hardened: true }, // BIP44 Bitcoin
    ]

    const bsv = await (await import("scrypt-ts")).bsv

    for (const { path, hardened } of testPaths) {
      console.log(`[Derivation Test] Testing path: ${path} (hardened: ${hardened})`)

      const pathResults = {
        path,
        hardened,
        derived: {
          privateKey: "",
          publicKey: "",
          address: "",
        },
        consistent: true,
        attempts: [],
      }

      // Multiple derivation attempts for each path
      for (let i = 0; i < attempts; i++) {
        console.log(`[Derivation Test] Attempt ${i + 1}/${attempts} for path ${path}`)

        const { privateKey, publicKey } = await deriveKeysFromSeed(seed, bsv, path)
        const address = publicKey.toAddress().toString()

        const currentAttempt = {
          attempt: i + 1,
          privateKey: privateKey.toString(),
          publicKey: publicKey.toString(),
          address,
          matchesFirst: true,
        }

        // Store first attempt as reference
        if (i === 0) {
          pathResults.derived = {
            privateKey: privateKey.toString(),
            publicKey: publicKey.toString(),
            address,
          }
        } else {
          // Compare with first attempt
          currentAttempt.matchesFirst =
            currentAttempt.privateKey === pathResults.derived.privateKey &&
            currentAttempt.publicKey === pathResults.derived.publicKey &&
            currentAttempt.address === pathResults.derived.address

          if (!currentAttempt.matchesFirst) {
            pathResults.consistent = false
            console.error(`[Derivation Test] Inconsistent derivation for path ${path}:`, {
              first: {
                privateKey: pathResults.derived.privateKey.substring(0, 10),
                address: pathResults.derived.address,
              },
              current: {
                privateKey: currentAttempt.privateKey.substring(0, 10),
                address: currentAttempt.address,
              },
            })
          }
        }

        pathResults.attempts.push(currentAttempt)
      }

      result.paths.push(pathResults)
    }

    // Analyze results
    const hardenedPath = result.paths.find((p) => p.hardened)
    const nonHardenedPath = result.paths.find((p) => !p.hardened)
    const bip44Path = result.paths.find((p) => p.path.startsWith("m/44'/"))

    result.details = {
      consistentDerivation: result.paths.every((p) => p.consistent),
      pathAffectsKeys: new Set(result.paths.map((p) => p.derived.address)).size > 1,
      hardenedVsNonHardened: {
        keysMatch: hardenedPath?.derived.privateKey === nonHardenedPath?.derived.privateKey,
        addressesMatch: hardenedPath?.derived.address === nonHardenedPath?.derived.address,
      },
    }

    result.success = result.details.consistentDerivation

    console.log("[Derivation Test] Test completed:", {
      success: result.success,
      details: result.details,
    })
  } catch (error) {
    console.error("[Derivation Test] Error:", error)
    result.error = error instanceof Error ? error.message : "Unknown error during derivation path test"
    result.success = false
  }

  return result
}

export async function runDerivationPathTest() {
  console.log("Starting derivation path test...")
  const result = await testDerivationPaths()

  // Create readable output
  const output = {
    success: result.success,
    mnemonic: result.mnemonic,
    paths: result.paths.map((path) => ({
      path: path.path,
      hardened: path.hardened,
      consistent: path.consistent,
      address: path.derived.address,
      attempts: path.attempts.map((a) => ({
        attempt: a.attempt,
        address: a.address,
        matchesFirst: a.matchesFirst,
      })),
    })),
    details: result.details,
    error: result.error,
  }

  console.log("Derivation path test result:", JSON.stringify(output, null, 2))
  return output
}