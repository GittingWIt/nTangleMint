import type { WalletData, Program, ProgramStats } from "@/types"
import { mockMerchantWallet } from "./mock/wallet-data"
import { STORAGE_KEYS, STORAGE_EVENTS } from "./constants"
import { debug } from "./debug"
// import { v4 as uuidv4 } from "uuid"

// Replace the uuid import with this function
function generateUUID(): string {
  // This is a simple UUID v4 implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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

// Update the cleanupWalletTypes function to be exported
export async function cleanupWalletTypes(currentMnemonic?: string) {
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
    return programs.filter(validateProgram)
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
export async function addProgram(program: Omit<Program, "id">): Promise<Program> {
  if (typeof window === "undefined") {
    throw new Error("window is undefined")
  }

  try {
    const id = generateUUID() // Use our custom function instead of uuidv4()
    const newProgram: Program = {
      ...program,
      id,
      description: program.description || "", // Ensure description is initialized
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const programs = await getPrograms()
    programs.push(newProgram)
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs))

    // Dispatch event
    window.dispatchEvent(new CustomEvent("programsUpdated"))

    debug("Program added successfully")
    return newProgram
  } catch (error) {
    console.error("Failed to add program:", error)
    handleStorageError(error as Error, "addProgram") // Handle storage errors
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
    handleStorageError(error as Error, "getProgram") // Handle storage errors
    return null
  }
}

// Create a default ProgramStats object
const createDefaultStats = (): ProgramStats => ({
  participantCount: 0,
  rewardsIssued: 0,
  rewardsRedeemed: 0,
  totalValue: 0,
})

// Helper function to handle optional properties with exactOptionalPropertyTypes
function getOptionalProperty<T>(
  updates: Partial<Program>,
  key: keyof Program,
  originalValue: T | undefined,
  defaultValue: T,
): T {
  // If the property exists in updates, use it
  if (key in updates) {
    const value = updates[key] as unknown as T
    // If the value is undefined, use the default
    return value !== undefined ? value : defaultValue
  }
  // Otherwise use the original value or default
  return originalValue !== undefined ? originalValue : defaultValue
}

// Add this to lib/storage.ts if it's not already there
export async function updateProgram(id: string, updates: Partial<Program>): Promise<void> {
  if (typeof window === "undefined") return

  try {
    debug("Updating program:", id)
    const programs = await getPrograms()
    const index = programs.findIndex((p) => p.id === id)

    if (index === -1) {
      throw new Error(`Program ${id} not found`)
    }

    // Get the original program
    const originalProgram = programs[index]

    // Add explicit check to satisfy TypeScript
    if (!originalProgram) {
      throw new Error(`Program ${id} found at index but is undefined`)
    }

    // Handle stats properly - ensure it's never undefined
    const originalStats = originalProgram.stats || createDefaultStats()
    const updatedStats = updates.stats ? { ...originalStats, ...updates.stats } : originalStats

    // Create the updated program with explicit required properties
    // This ensures TypeScript knows these properties are definitely present
    const updatedProgram: Program = {
      // Required properties explicitly copied from original
      id: originalProgram.id,
      type: updates.type || originalProgram.type,
      name: updates.name || originalProgram.name,
      description: updates.description || originalProgram.description,
      createdAt: originalProgram.createdAt,
      updatedAt: new Date().toISOString(),
      merchantAddress: updates.merchantAddress || originalProgram.merchantAddress,
      status: updates.status || originalProgram.status,
      metadata: { ...originalProgram.metadata, ...(updates.metadata || {}) },
      version: updates.version || originalProgram.version,
      isPublic: updates.isPublic !== undefined ? updates.isPublic : originalProgram.isPublic,
      stats: updatedStats, // Use the properly handled stats
      participants: updates.participants || originalProgram.participants || [], // Add the participants property

      // Handle optional properties properly
      previousVersionId: getOptionalProperty(updates, "previousVersionId", originalProgram.previousVersionId, ""),
      allowedParticipants: getOptionalProperty(updates, "allowedParticipants", originalProgram.allowedParticipants, []),
      maxParticipants: getOptionalProperty(updates, "maxParticipants", originalProgram.maxParticipants, 0),
      perUserLimit: getOptionalProperty(updates, "perUserLimit", originalProgram.perUserLimit, 0),
      requiresReceipt: getOptionalProperty(updates, "requiresReceipt", originalProgram.requiresReceipt, false),
      minimumAge: getOptionalProperty(updates, "minimumAge", originalProgram.minimumAge, 0),
      geographicRestrictions: getOptionalProperty(
        updates,
        "geographicRestrictions",
        originalProgram.geographicRestrictions,
        [],
      ),
    }

    // Replace the program in the array
    programs[index] = updatedProgram

    // Save updated programs
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs))

    // Dispatch event
    window.dispatchEvent(new CustomEvent("programsUpdated"))

    debug("Program updated successfully")
  } catch (error) {
    console.error("Failed to update program:", error)
    handleStorageError(error as Error, "updateProgram") // Handle storage errors
    throw error
  }
}