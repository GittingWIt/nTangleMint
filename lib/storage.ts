import type { WalletData, Program } from "@/types"
import { mockMerchantWallet } from "./mock/wallet-data"
import { STORAGE_KEYS, STORAGE_EVENTS } from "./constants"
import { debug } from "./debug"

// Define constants locally to avoid import errors
const DEBUG = process.env.NODE_ENV === "development"
const NAVIGATION_LOCK_TIMEOUT = 2000 // 2 seconds
const TEST_MODE = false // Was previously set to true
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 500

// Session storage for sensitive data (development only)
let sessionWalletData: WalletData | null = null

// Add error tracking
let storageErrorCount = 0
const MAX_STORAGE_ERRORS = 3
const ERROR_RESET_INTERVAL = 5000 // 5 seconds

async function hashMnemonic(mnemonic: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(mnemonic)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex.slice(0, 16)
}

// Update the validateWalletData function to be more lenient with mock data
function validateWalletData(data: any): data is WalletData {
  if (!data || typeof data !== "object") {
    console.log("Invalid data object:", data)
    return false
  }

  // Special case for test mode
  if (TEST_MODE) {
    debug("Test mode detected, using relaxed validation")

    // Basic structure validation for test mode
    const hasBasicFields =
      typeof data.publicKey === "string" && typeof data.publicAddress === "string" && data.type === "merchant"

    if (hasBasicFields) {
      debug("Mock wallet data validated in test mode")
      return true
    }
  }

  // Regular validation for non-test mode
  const hasRequiredFields =
    typeof data.privateKey === "string" &&
    typeof data.publicKey === "string" &&
    typeof data.publicAddress === "string" &&
    (data.type === "user" || data.type === "merchant")

  if (!hasRequiredFields) {
    debug("Invalid wallet data structure:", data)
    return false
  }

  // Skip regex validation in test mode
  if (TEST_MODE) {
    debug("Skipping regex validation in test mode")
    return true
  }

  // Validate field formats
  const privateKeyRegex = /^[KL][1-9A-HJ-NP-Za-km-z]{51}$/
  const publicKeyRegex = /^02|03[0-9A-Fa-f]{64}$/
  const addressRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/

  const isValidFormat =
    privateKeyRegex.test(data.privateKey) &&
    publicKeyRegex.test(data.publicKey) &&
    addressRegex.test(data.publicAddress)

  if (!isValidFormat) {
    debug("Invalid key formats")
    return false
  }

  return true
}

async function cleanupWalletTypes(currentMnemonic?: string) {
  if (typeof window === "undefined") return

  try {
    const keys = Object.keys(localStorage)
    const typeKeys = keys.filter((key) => key.startsWith(STORAGE_KEYS.WALLET_TYPE_PREFIX))

    if (currentMnemonic) {
      const currentKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(currentMnemonic)}`
      for (const key of typeKeys) {
        if (key !== currentKey) {
          localStorage.removeItem(key)
        }
      }
    }

    debug("Cleaned up wallet types, remaining:", typeKeys)
  } catch (err) {
    console.error("Failed to cleanup wallet types:", err)
  }
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  validate: (result: T) => boolean,
  attempts: number = RETRY_ATTEMPTS,
): Promise<T | null> {
  let lastError: Error | null = null

  for (let i = 0; i < attempts; i++) {
    try {
      const result = await operation()
      if (validate(result)) {
        return result
      }
      debug(`Attempt ${i + 1}: Invalid result`)
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    } catch (err) {
      lastError = err as Error
      debug(`Attempt ${i + 1} failed:`, err)
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
    }
  }

  if (lastError) throw lastError
  return null
}

export function setNavigationLock(): boolean {
  if (typeof window === "undefined") return false

  try {
    const currentLock = localStorage.getItem(STORAGE_KEYS.NAVIGATION_LOCK)
    if (currentLock) {
      const lockTime = Number.parseInt(currentLock, 10)
      if (Date.now() - lockTime < NAVIGATION_LOCK_TIMEOUT) {
        return false
      }
    }

    localStorage.setItem(STORAGE_KEYS.NAVIGATION_LOCK, Date.now().toString())
    return true
  } catch (err) {
    console.error("Failed to set navigation lock:", err)
    return false
  }
}

export function clearNavigationLock(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.NAVIGATION_LOCK)
  } catch (err) {
    console.error("Failed to clear navigation lock:", err)
  }
}

// Add this function to check if wallet data is valid
export async function isWalletValid(wallet: WalletData | null): Promise<boolean> {
  if (!wallet) return false

  try {
    // Basic validation
    if (!wallet.publicAddress || !wallet.type) {
      return false
    }

    // Additional validation for test mode
    if (TEST_MODE) {
      return wallet.type === "merchant" && wallet.publicAddress === mockMerchantWallet.publicAddress
    }

    // Full validation for production
    return validateWalletData(wallet)
  } catch (err) {
    console.error("Error validating wallet:", err)
    return false
  }
}

// Update the getWalletData function to handle both client and server contexts
export async function getWalletData(): Promise<WalletData | null> {
  if (typeof window === "undefined") return null

  try {
    debug("Client: Getting wallet data from localStorage")

    // Check session storage first (for development)
    if (sessionWalletData && (await isWalletValid(sessionWalletData))) {
      debug("Client: Using valid session wallet data")
      return sessionWalletData
    }

    // Check localStorage
    const data = localStorage.getItem(STORAGE_KEYS.WALLET_DATA)
    if (!data) {
      debug("Client: No wallet data in localStorage")
      return null
    }

    try {
      const walletData = JSON.parse(data)
      if (await isWalletValid(walletData)) {
        debug("Client: Valid wallet data found")
        sessionWalletData = walletData // Update session storage
        return walletData
      }

      debug("Client: Invalid wallet data found, clearing storage")
      await clearWalletData()
      return null
    } catch (parseError) {
      debug("Client: Error parsing wallet data:", parseError)
      await clearWalletData()
      return null
    }
  } catch (err) {
    console.error("Failed to get wallet data:", err)
    return null
  }
}

// Update setWalletData to handle cookie storage via document.cookie
export async function setWalletData(data: WalletData): Promise<void> {
  if (typeof window === "undefined") {
    debug("Cannot set wallet data from server context")
    return
  }

  try {
    debug("Setting wallet data")

    if (!validateWalletData(data)) {
      console.error("Invalid wallet data:", data)
      throw new Error("Invalid wallet data")
    }

    // Store in session storage
    sessionWalletData = data
    debug("Stored wallet data in session")

    // Store in localStorage
    localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data))
    debug("Stored wallet data in localStorage")

    // Store in cookie for server access
    document.cookie = `walletData=${JSON.stringify(data)}; path=/; max-age=${60 * 60 * 24 * 7}`
    debug("Stored wallet data in cookie")

    // Clear any existing navigation locks
    clearNavigationLock()

    // Dispatch event to notify components
    window.dispatchEvent(new Event(STORAGE_EVENTS.WALLET_UPDATED))
  } catch (err) {
    console.error("Failed to set wallet data:", err)
    throw err
  }
}

export async function clearWalletData(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    debug("Clearing wallet data")

    const operation = async () => {
      if (!setNavigationLock()) {
        throw new Error("Navigation lock active")
      }

      try {
        if (DEBUG) {
          sessionWalletData = null
        }

        const data = await getWalletData()
        if (data?.mnemonic) {
          const typeKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(data.mnemonic)}`
          localStorage.setItem(typeKey, data.type)
        }

        localStorage.removeItem(STORAGE_KEYS.WALLET_DATA)
        return true
      } finally {
        clearNavigationLock()
      }
    }

    await retryOperation(operation, (result) => result === true)
    window.dispatchEvent(new Event(STORAGE_EVENTS.WALLET_UPDATED))
  } catch (err) {
    console.error("Failed to clear wallet data:", err)
    clearNavigationLock()
  }
}

export async function getStoredWalletType(mnemonic: string): Promise<"user" | "merchant" | null> {
  if (typeof window === "undefined") return null

  try {
    const operation = async () => {
      if (!setNavigationLock()) {
        throw new Error("Navigation lock active")
      }

      try {
        const typeKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(mnemonic)}`
        const type = localStorage.getItem(typeKey)
        // Ensure we only return valid types
        return type === "user" || type === "merchant" ? type : null
      } finally {
        clearNavigationLock()
      }
    }

    const result = await retryOperation(
      operation,
      (type): type is "user" | "merchant" => type === "user" || type === "merchant",
    )

    debug("Getting stored wallet type:", result)
    return result
  } catch (err) {
    console.error("Failed to get stored wallet type:", err)
    clearNavigationLock()
    return null
  }
}

export function debugStorage(): void {
  if (!DEBUG) return

  try {
    console.group("Storage Debug Info")
    console.log("Session wallet data:", sessionWalletData)
    console.log("Local storage data:", localStorage.getItem(STORAGE_KEYS.WALLET_DATA))
    console.log("Navigation lock:", localStorage.getItem(STORAGE_KEYS.NAVIGATION_LOCK))
    console.log("TEST_MODE (forced):", TEST_MODE)
    console.log("NEXT_PUBLIC_TEST_MODE env:", process.env.NEXT_PUBLIC_TEST_MODE)
    console.groupEnd()
  } catch (err) {
    console.error("Debug info error:", err)
  }
}

// Update the getPrograms function to filter out invalid programs

export async function getPrograms(): Promise<Program[]> {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRAMS)

    // Initialize empty array if no programs exist
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify([]))
      return []
    }

    const programs = JSON.parse(data)

    // Validate programs array
    if (!Array.isArray(programs)) {
      console.error("Invalid programs data format")
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify([]))
      return []
    }

    // Filter out invalid programs
    return programs.filter(
      (program) =>
        program && typeof program === "object" && typeof program.id === "string" && typeof program.name === "string",
    )
  } catch (error) {
    console.error("Failed to get programs:", error)
    return []
  }
}

// Add this function to handle storage errors
function handleStorageError(error: Error, operation: string) {
  console.error(`Storage error during ${operation}:`, error)
  storageErrorCount++

  // Dispatch error event
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENTS.STORAGE_ERROR, {
      detail: { error, operation, count: storageErrorCount },
    }),
  )

  // Reset error count after interval
  setTimeout(() => {
    storageErrorCount = 0
  }, ERROR_RESET_INTERVAL)

  // If too many errors, trigger sync
  if (storageErrorCount >= MAX_STORAGE_ERRORS) {
    triggerStorageSync()
  }
}

// Add storage sync function
async function triggerStorageSync() {
  try {
    const programs = await getPrograms()
    const wallet = await getWalletData()

    // Dispatch sync event with current state
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENTS.STORAGE_SYNC, {
        detail: { programs, wallet },
      }),
    )

    storageErrorCount = 0
  } catch (error) {
    console.error("Storage sync failed:", error)
  }
}

// Add program validation
function validateProgram(program: unknown): program is Program {
  if (!program || typeof program !== "object") return false

  const p = program as Program

  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.description === "string" &&
    typeof p.merchantAddress === "string" &&
    typeof p.createdAt === "string" &&
    typeof p.updatedAt === "string" &&
    ["active", "draft", "paused", "expired", "cancelled"].includes(p.status) &&
    typeof p.metadata === "object"
  )
}

// Update the addProgram function to be more robust
export async function addProgram(program: Program): Promise<void> {
  if (typeof window === "undefined") return

  try {
    debug("Adding program:", program.id)

    // Get existing programs
    const existingPrograms = await getPrograms()

    // Add new program
    const updatedPrograms = [...existingPrograms, program]

    // Store updated programs
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(updatedPrograms))

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENTS.PROGRAM_CREATED, {
        detail: { program },
      }),
    )

    debug("Program added successfully")
  } catch (error) {
    console.error("Failed to add program:", error)
    throw error
  }
}

// Add a function to get a single program
export async function getProgram(id: string): Promise<Program | null> {
  if (typeof window === "undefined") return null

  try {
    const programs = await getPrograms()
    return programs.find((p) => p.id === id) || null
  } catch (error) {
    console.error("Failed to get program:", error)
    return null
  }
}