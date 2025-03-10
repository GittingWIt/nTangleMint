import { generateMnemonic, validateMnemonic } from "./mnemonic"
import { mnemonicToSeedSync } from "@scure/bip39"
import type { WalletData } from "@/types"
import { setWalletData, getStoredWalletType } from "@/lib/storage"
import { WALLET_CONFIG } from "@/lib/constants"

export { validateMnemonic }

// Add this section to the top of the file
const WALLET_SECURITY = {
  CREATION: {
    REQUIRE_PASSWORD: true,
    MIN_PASSWORD_LENGTH: 8,
    PASSWORD_VALIDATION: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  },
  RESTORATION: {
    REQUIRE_PASSWORD: false,
    WARN_NO_PASSWORD: true,
  },
} as const

// Add this function near the top
function validatePassword(password: string | undefined, isCreation: boolean): void {
  if (isCreation && WALLET_SECURITY.CREATION.REQUIRE_PASSWORD) {
    if (!password) {
      throw new Error("Password is required for wallet creation")
    }
    if (password.length < WALLET_SECURITY.CREATION.MIN_PASSWORD_LENGTH) {
      throw new Error("Password must be at least 8 characters")
    }
    if (!WALLET_SECURITY.CREATION.PASSWORD_VALIDATION.test(password)) {
      throw new Error(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
    }
  }
}

/**
 * Constants for BSV wallet implementation
 */
const DERIVATION_PATHS = {
  USER: {
    DEFAULT: "m/44'/236'/0'/0/0", // BSV-specific BIP44 path for users
    WITH_PASSWORD: "m/44'/236'/0'/1/0", // BSV-specific BIP44 path for users with password
  },
  MERCHANT: {
    DEFAULT: "m/44'/236'/1'/0/0", // BSV-specific BIP44 path for merchants
    WITH_PASSWORD: "m/44'/236'/1'/1/0", // BSV-specific BIP44 path for merchants with password
  },
} as const

/**
 * Regular expressions for validating key formats
 */
const PRIVATE_KEY_REGEX = /^[KL][1-9A-HJ-NP-Za-km-z]{51}$/
const PUBLIC_KEY_REGEX = /^02|03[0-9A-Fa-f]{64}$/
const ADDRESS_REGEX = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/

/**
 * Loads the BSV library from scrypt-ts
 */
async function getBsvLib() {
  try {
    const { bsv } = await import("scrypt-ts")
    if (!bsv) {
      throw new Error("BSV library not found in scrypt-ts")
    }
    return bsv
  } catch (error) {
    console.error("[Wallet Error] Failed to load BSV library:", error)
    throw new Error(`Failed to load wallet library: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validates the format of generated keys and addresses
 */
function validateKeyFormats(privateKey: string, publicKey: string, address: string): boolean {
  const isValidPrivateKey = PRIVATE_KEY_REGEX.test(privateKey)
  const isValidPublicKey = PUBLIC_KEY_REGEX.test(publicKey)
  const isValidAddress = ADDRESS_REGEX.test(address)

  if (!isValidPrivateKey || !isValidPublicKey || !isValidAddress) {
    console.error("[Wallet Error] Key format validation failed:", {
      privateKey: isValidPrivateKey,
      publicKey: isValidPublicKey,
      address: isValidAddress,
    })
    return false
  }

  return true
}

/**
 * Gets the appropriate derivation path based on wallet type and password presence
 */
function getDerivationPath(type: "user" | "merchant", hasPassword: boolean): string {
  const paths = type === "user" ? DERIVATION_PATHS.USER : DERIVATION_PATHS.MERCHANT
  const path = hasPassword ? paths.WITH_PASSWORD : paths.DEFAULT
  console.log(`[Wallet Debug] Selected derivation path for ${type}${hasPassword ? " with password" : ""}: ${path}`)
  return path
}

/**
 * Derives cryptographic keys from a seed using a specific derivation path
 */
export async function deriveKeysFromSeed(
  seed: Buffer | Uint8Array,
  type: "user" | "merchant",
  hasPassword: boolean,
): Promise<{ privateKey: any; publicKey: any; address: string }> {
  try {
    // Ensure consistent seed format
    const seedBuffer = Buffer.isBuffer(seed) ? seed : Buffer.from(seed)
    const seedHex = seedBuffer.toString("hex")

    console.log(`[Wallet Debug] Deriving keys:`, {
      type,
      hasPassword,
      seedLength: seedBuffer.length,
      seedHexPrefix: seedHex.substring(0, 8) + "...",
    })

    const bsv = await getBsvLib()

    // Add network verification:
    console.log(`[Wallet Debug] Using network: ${WALLET_CONFIG.NETWORK}`)
    if (!["mainnet", "testnet"].includes(WALLET_CONFIG.NETWORK)) {
      throw new Error(`Invalid network configuration: ${WALLET_CONFIG.NETWORK}`)
    }

    // Create HDPrivateKey from seed with explicit network
    const hdPrivateKey = bsv.HDPrivateKey.fromSeed(seedBuffer, WALLET_CONFIG.NETWORK)

    // Get the appropriate derivation path
    const path = getDerivationPath(type, hasPassword)

    // Derive child key using the specified path
    const derived = hdPrivateKey.deriveChild(path)
    const privateKey = derived.privateKey
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const address = publicKey.toAddress().toString()

    console.log(`[Wallet Debug] Derived address: ${address}`)

    // Verify key formats
    if (!validateKeyFormats(privateKey.toString(), publicKey.toString(), address)) {
      throw new Error("Generated keys failed format validation")
    }

    // Double-check derivation consistency
    const verificationKey = bsv.HDPrivateKey.fromSeed(seedBuffer, WALLET_CONFIG.NETWORK)
    const verificationAddress = verificationKey.deriveChild(path).privateKey.publicKey.toAddress().toString()

    if (address !== verificationAddress) {
      console.error("[Wallet Error] Address verification failed:", {
        original: address,
        verification: verificationAddress,
      })
      throw new Error("Address verification failed - inconsistent derivation")
    }

    // Add after seed generation
    const seedHexOriginal = seedBuffer.toString("hex")
    console.log(`[Wallet Debug] Original seed hex (first 8 chars): ${seedHexOriginal.substring(0, 8)}`)

    // Add verification step before returning
    const verificationSeedHex = Buffer.from(seed).toString("hex")
    if (seedHexOriginal !== verificationSeedHex) {
      console.error("[Wallet Error] Seed verification failed:", {
        original: seedHexOriginal.substring(0, 8),
        verification: verificationSeedHex.substring(0, 8),
      })
      throw new Error("Seed verification failed - inconsistent seed generation")
    }

    return { privateKey, publicKey, address }
  } catch (error) {
    console.error("[Wallet Error] Key derivation failed:", error)
    throw error
  }
}

/**
 * Initializes a wallet with the given mnemonic and optional password
 */
async function initializeWallet(
  mnemonic: string,
  password: string | undefined,
  type: "user" | "merchant",
): Promise<WalletData> {
  try {
    // Normalize mnemonic
    const normalizedMnemonic = mnemonic.toLowerCase().trim()
    console.log(`[Wallet Debug] Initializing wallet:`, {
      type,
      hasPassword: !!password,
      mnemonicLength: normalizedMnemonic.split(" ").length,
    })

    // Generate seed with password
    const seed = mnemonicToSeedSync(normalizedMnemonic, password || "")

    // Add after seed generation
    console.log(`[Wallet Debug] Seed generation:`, {
      mnemonicLength: normalizedMnemonic.split(" ").length,
      seedLength: seed.length,
      seedHexPrefix: Buffer.from(seed).toString("hex").substring(0, 8),
    })

    // Add before key derivation
    const seedVerification = mnemonicToSeedSync(normalizedMnemonic, password || "")
    if (Buffer.from(seed).toString("hex") !== Buffer.from(seedVerification).toString("hex")) {
      throw new Error("Seed verification failed before key derivation")
    }

    console.log(`[Wallet Debug] Generated seed (length: ${seed.length} bytes)`)

    // Derive keys
    const { privateKey, publicKey, address } = await deriveKeysFromSeed(seed, type, !!password)

    // Create timestamp for createdAt and updatedAt
    const timestamp = new Date().toISOString()

    const wallet: WalletData = {
      mnemonic: normalizedMnemonic,
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
      publicAddress: address,
      type,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    // Verify wallet data before storage
    const verificationSeed = mnemonicToSeedSync(normalizedMnemonic, password || "")
    const verification = await deriveKeysFromSeed(verificationSeed, type, !!password)

    if (verification.address !== wallet.publicAddress) {
      console.error("[Wallet Error] Wallet verification failed:", {
        original: wallet.publicAddress,
        verification: verification.address,
      })
      throw new Error("Wallet verification failed - inconsistent address generation")
    }

    // Store wallet data
    await setWalletData(wallet)
    console.log(`[Wallet Debug] Wallet initialized and stored:`, {
      type: wallet.type,
      address: wallet.publicAddress,
      publicKey: wallet.publicKey.substring(0, 10) + "...",
    })

    return wallet
  } catch (err) {
    console.error("[Wallet Error] Initialization failed:", err)
    throw err
  }
}

/**
 * Generates a new wallet with optional password
 */
export async function generateWallet(
  password: string | undefined,
  type: "user" | "merchant" = "user",
): Promise<WalletData> {
  console.log(`[Wallet Debug] Generating new ${type} wallet`)

  // Validate password for creation
  validatePassword(password, true)

  const mnemonic = await generateMnemonic()
  if (!mnemonic) throw new Error("Failed to generate recovery phrase")

  return await initializeWallet(mnemonic, password, type)
}

/**
 * Restores a wallet from a mnemonic phrase and optional password
 */
export async function restoreWallet(
  mnemonic: string,
  password: string | undefined,
  type?: "user" | "merchant",
): Promise<WalletData> {
  console.log(`[Wallet Debug] Restoring wallet${password ? " with password" : " without password"}`)

  // Add warning for restoration without password
  if (!password && WALLET_SECURITY.RESTORATION.WARN_NO_PASSWORD) {
    console.warn(
      "[Wallet Warning] Restoring wallet without password. If the wallet was created with a password, " +
        "you will access a different set of addresses.",
    )
  }

  const normalizedMnemonic = mnemonic.toLowerCase().trim()
  if (!validateMnemonic(normalizedMnemonic)) {
    throw new Error("Invalid recovery phrase")
  }

  const storedType = await getStoredWalletType(normalizedMnemonic)
  const finalType = type || storedType || "user"

  return await initializeWallet(normalizedMnemonic, password, finalType)
}