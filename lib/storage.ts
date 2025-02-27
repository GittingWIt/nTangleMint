import type { WalletData } from "@/types"
import { STORAGE_KEYS } from "@/lib/constants"

const DEBUG = process.env.NODE_ENV === "development"
const NAVIGATION_LOCK_KEY = "navigation_lock"
const NAVIGATION_LOCK_TIMEOUT = 2000 // 2 seconds

// Session storage for sensitive data (development only)
let sessionWalletData: WalletData | null = null

function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[Storage Debug]:", ...args)
  }
}

async function hashMnemonic(mnemonic: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(mnemonic)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex.slice(0, 16)
}

function validateWalletData(data: any): data is WalletData {
  if (!data || typeof data !== "object") return false

  const hasRequiredFields =
    typeof data.mnemonic === "string" &&
    typeof data.privateKey === "string" &&
    typeof data.publicKey === "string" &&
    typeof data.publicAddress === "string" &&
    (data.type === "user" || data.type === "merchant")

  if (!hasRequiredFields) {
    debug("Invalid wallet data structure:", data)
    return false
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
    debug("Invalid key formats:", {
      privateKey: data.privateKey.substring(0, 10) + "...",
      publicKey: data.publicKey.substring(0, 10) + "...",
      address: data.publicAddress,
    })
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

// Export the function so it can be used by other modules
export function setNavigationLock(): boolean {
  if (typeof window === "undefined") return false

  try {
    const currentLock = localStorage.getItem(NAVIGATION_LOCK_KEY)
    if (currentLock) {
      const lockTime = Number.parseInt(currentLock, 10)
      if (Date.now() - lockTime < NAVIGATION_LOCK_TIMEOUT) {
        return false
      }
    }

    localStorage.setItem(NAVIGATION_LOCK_KEY, Date.now().toString())
    return true
  } catch (err) {
    console.error("Failed to set navigation lock:", err)
    return false
  }
}

export function clearNavigationLock(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(NAVIGATION_LOCK_KEY)
  } catch (err) {
    console.error("Failed to clear navigation lock:", err)
  }
}

export async function getWalletData(): Promise<WalletData | null> {
  if (typeof window === "undefined") return null

  try {
    debug("Getting wallet data")

    // Check navigation lock before proceeding
    if (!setNavigationLock()) {
      debug("Navigation lock active, waiting...")
      return null
    }

    // In development, return session data
    if (DEBUG && sessionWalletData) {
      debug("Returning session wallet data")
      clearNavigationLock()
      return sessionWalletData
    }

    // In production, only return non-sensitive data from storage
    const data = localStorage.getItem(STORAGE_KEYS.WALLET_DATA)
    if (!data) {
      debug("No wallet data found")
      clearNavigationLock()
      return null
    }

    let walletData: unknown
    try {
      walletData = JSON.parse(data)
    } catch (parseError) {
      debug("Failed to parse wallet data:", parseError)
      clearNavigationLock()
      return null
    }

    if (!validateWalletData(walletData)) {
      debug("Invalid wallet data")
      clearNavigationLock()
      return null
    }

    // Add path property for routing
    walletData.path = `/${walletData.type}`

    debug("Successfully retrieved wallet data")
    clearNavigationLock()
    return walletData
  } catch (err) {
    console.error("Failed to get wallet data:", err)
    clearNavigationLock()
    return null
  }
}

export async function setWalletData(data: WalletData): Promise<void> {
  if (typeof window === "undefined") return

  try {
    debug("Setting wallet data")

    // Check navigation lock before proceeding
    if (!setNavigationLock()) {
      throw new Error("Navigation lock active")
    }

    if (!validateWalletData(data)) {
      clearNavigationLock()
      throw new Error("Invalid wallet data")
    }

    // In development, store in session
    if (DEBUG) {
      sessionWalletData = data
      debug("Stored wallet data in session")
    }

    // In production, only store non-sensitive data
    const storageData = {
      ...data,
      // Remove sensitive data in production
      mnemonic: DEBUG ? data.mnemonic : undefined,
      privateKey: DEBUG ? data.privateKey : undefined,
    }

    localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(storageData))

    if (data.mnemonic) {
      const typeKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(data.mnemonic)}`
      localStorage.setItem(typeKey, data.type)
      await cleanupWalletTypes(data.mnemonic)
    }

    window.dispatchEvent(new Event("walletUpdated"))
    clearNavigationLock()
  } catch (err) {
    console.error("Failed to set wallet data:", err)
    clearNavigationLock()
    throw err
  }
}

export async function clearWalletData(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    debug("Clearing wallet data")

    // Check navigation lock before proceeding
    if (!setNavigationLock()) {
      throw new Error("Navigation lock active")
    }

    // Clear session data in development
    if (DEBUG) {
      sessionWalletData = null
    }

    const data = await getWalletData()
    if (data?.mnemonic) {
      const typeKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(data.mnemonic)}`
      localStorage.setItem(typeKey, data.type) // Preserve type mapping
    }

    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA)
    window.dispatchEvent(new Event("walletUpdated"))
    clearNavigationLock()
  } catch (err) {
    console.error("Failed to clear wallet data:", err)
    clearNavigationLock()
  }
}

export async function getStoredWalletType(mnemonic: string): Promise<"user" | "merchant" | null> {
  if (typeof window === "undefined") return null

  try {
    // Check navigation lock before proceeding
    if (!setNavigationLock()) {
      throw new Error("Navigation lock active")
    }

    const typeKey = `${STORAGE_KEYS.WALLET_TYPE_PREFIX}${await hashMnemonic(mnemonic)}`
    const storedType = localStorage.getItem(typeKey)
    debug("Getting stored wallet type:", storedType)

    clearNavigationLock()
    if (storedType === "user" || storedType === "merchant") {
      return storedType
    }
    return null
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
    console.log("Navigation lock:", localStorage.getItem(NAVIGATION_LOCK_KEY))
    console.groupEnd()
  } catch (err) {
    console.error("Debug info error:", err)
  }
}