/**
 * Initialization Tracker
 *
 * This utility helps prevent repeated initialization of components
 * by tracking initialization state in sessionStorage.
 */

// Key for storing initialization state
const INIT_KEY = "ntanglemint_initialized"
const PROGRAMS_INIT_KEY = "ntanglemint_programs_initialized"
const MERCHANT_PAGE_REFRESH_COUNT = "merchantPageRefreshCount"
const WALLET_INIT_ATTEMPTS = "wallet_init_attempts"
const MAX_WALLET_INIT_ATTEMPTS = 10 // Increased from 3 to 10 to be more lenient

/**
 * Check if the application has been initialized in this session
 */
export function isInitialized(): boolean {
  if (typeof window === "undefined") return false

  try {
    return sessionStorage.getItem(INIT_KEY) === "true"
  } catch (e) {
    console.error("Error checking initialization state:", e)
    return false
  }
}

/**
 * Mark the application as initialized
 */
export function markInitialized(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(INIT_KEY, "true")
  } catch (e) {
    console.error("Error marking as initialized:", e)
  }
}

/**
 * Track wallet initialization attempts to prevent infinite loops
 */
export function trackWalletInitAttempt(): number {
  if (typeof window === "undefined") return 0

  try {
    // In development mode, be more lenient with tracking
    if (process.env.NODE_ENV === "development") {
      // Only increment every other attempt to slow down the counter
      const currentAttempts = getWalletInitAttempts()
      if (currentAttempts % 2 === 1) {
        return currentAttempts
      }
    }

    const currentAttempts = getWalletInitAttempts()
    const newAttemptCount = currentAttempts + 1
    sessionStorage.setItem(WALLET_INIT_ATTEMPTS, newAttemptCount.toString())
    return newAttemptCount
  } catch (e) {
    console.error("Error tracking wallet init attempt:", e)
    return 0
  }
}

/**
 * Get the current number of wallet initialization attempts
 */
export function getWalletInitAttempts(): number {
  if (typeof window === "undefined") return 0

  try {
    const attempts = sessionStorage.getItem(WALLET_INIT_ATTEMPTS)
    return attempts ? Number.parseInt(attempts, 10) : 0
  } catch (e) {
    console.error("Error getting wallet init attempts:", e)
    return 0
  }
}

/**
 * Check if wallet initialization should be blocked to prevent infinite loops
 */
export function shouldBlockWalletInit(): boolean {
  // In development mode, be more lenient
  if (process.env.NODE_ENV === "development") {
    return getWalletInitAttempts() >= MAX_WALLET_INIT_ATTEMPTS * 2
  }
  return getWalletInitAttempts() >= MAX_WALLET_INIT_ATTEMPTS
}

/**
 * Reset wallet initialization attempts counter
 */
export function resetWalletInitAttempts(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(WALLET_INIT_ATTEMPTS)
  } catch (e) {
    console.error("Error resetting wallet init attempts:", e)
  }
}

/**
 * Check if programs have been initialized
 */
export function areProgramsInitialized(): boolean {
  if (typeof window === "undefined") return false

  try {
    return sessionStorage.getItem(PROGRAMS_INIT_KEY) === "true"
  } catch (e) {
    console.error("Error checking program initialization state:", e)
    return false
  }
}

/**
 * Mark programs as initialized
 */
export function markProgramsInitialized(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(PROGRAMS_INIT_KEY, "true")
  } catch (e) {
    console.error("Error marking programs as initialized:", e)
  }
}

/**
 * Get the merchant page refresh count
 */
export function getMerchantPageRefreshCount(): number {
  if (typeof window === "undefined") return 0

  try {
    const count = sessionStorage.getItem(MERCHANT_PAGE_REFRESH_COUNT)
    return count ? Number.parseInt(count, 10) : 0
  } catch (e) {
    console.error("Error getting merchant page refresh count:", e)
    return 0
  }
}

/**
 * Increment the merchant page refresh count
 */
export function incrementMerchantPageRefreshCount(): number {
  if (typeof window === "undefined") return 0

  try {
    const currentCount = getMerchantPageRefreshCount()
    const newCount = currentCount + 1
    sessionStorage.setItem(MERCHANT_PAGE_REFRESH_COUNT, newCount.toString())
    return newCount
  } catch (e) {
    console.error("Error incrementing merchant page refresh count:", e)
    return 0
  }
}

/**
 * Reset the merchant page refresh count
 */
export function resetMerchantPageRefreshCount(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(MERCHANT_PAGE_REFRESH_COUNT)
  } catch (e) {
    console.error("Error resetting merchant page refresh count:", e)
  }
}

/**
 * Reset initialization state (for testing)
 */
export function resetInitializationState(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(INIT_KEY)
    sessionStorage.removeItem(PROGRAMS_INIT_KEY)
    sessionStorage.removeItem(MERCHANT_PAGE_REFRESH_COUNT)
    sessionStorage.removeItem(WALLET_INIT_ATTEMPTS)
  } catch (e) {
    console.error("Error resetting initialization state:", e)
  }
}

/**
 * Completely disable all initialization tracking to prevent refresh loops
 */
export function disableAllInitialization(): void {
  if (typeof window === "undefined") return

  try {
    // Set all initialization flags to true to prevent any further initialization
    sessionStorage.setItem(INIT_KEY, "true")
    sessionStorage.setItem(PROGRAMS_INIT_KEY, "true")
    sessionStorage.setItem("wallet_initialized", "true")
    sessionStorage.setItem("storage_initialized", "true")

    // Reset counters that might trigger refreshes
    sessionStorage.removeItem(MERCHANT_PAGE_REFRESH_COUNT)
    sessionStorage.removeItem(WALLET_INIT_ATTEMPTS)

    // Set global flag
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.__refreshLoopFixed = true
      // @ts-ignore
      window.__initializationDisabled = true
    }
  } catch (e) {
    console.error("Error disabling initialization:", e)
  }
}