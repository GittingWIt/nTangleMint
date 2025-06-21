/**
 * Refresh loop prevention utilities
 */
import { debug } from "./debug"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Constants
const REFRESH_LOOP_STORAGE_KEY = "refreshLoopDetected"
const INIT_DISABLED_KEY = "initializationDisabled"

/**
 * Check if the refresh loop fix has been applied
 */
export function isRefreshLoopFixed(): boolean {
  if (!isBrowser) return false

  // Check for the global flag
  // @ts-ignore
  if (window.__refreshLoopPrevented) return true

  // Check sessionStorage as fallback
  try {
    return sessionStorage.getItem(REFRESH_LOOP_STORAGE_KEY) === "true"
  } catch (e) {
    return false
  }
}

/**
 * Mark the refresh loop as fixed
 */
export function markRefreshLoopFixed(): void {
  if (!isBrowser) return

  debug("Marking refresh loop as fixed")

  // Set the global flag
  // @ts-ignore
  window.__refreshLoopPrevented = true

  // Store in sessionStorage to persist across refreshes
  try {
    sessionStorage.setItem(REFRESH_LOOP_STORAGE_KEY, "true")
  } catch (e) {
    console.error("Failed to set sessionStorage flag:", e)
  }
}

/**
 * Check if initialization should be disabled
 */
export function isInitializationDisabled(): boolean {
  if (!isBrowser) return false

  // Check for the global flag
  // @ts-ignore
  if (window.__forceDisableInitialization) return true

  // Check sessionStorage as fallback
  try {
    return sessionStorage.getItem(INIT_DISABLED_KEY) === "true"
  } catch (e) {
    return false
  }
}

/**
 * Disable all initialization to prevent refresh loops
 */
export function disableInitialization(): void {
  if (!isBrowser) return

  debug("Disabling all initialization")

  // Set the global flag
  // @ts-ignore
  window.__forceDisableInitialization = true

  // Store in sessionStorage to persist across refreshes
  try {
    sessionStorage.setItem(INIT_DISABLED_KEY, "true")
  } catch (e) {
    console.error("Failed to set sessionStorage flag:", e)
  }
}

/**
 * Reset all refresh prevention flags
 * This should only be used for debugging
 */
export function resetRefreshPrevention(): void {
  if (!isBrowser) return

  debug("Resetting refresh prevention flags")

  // Clear global flags
  // @ts-ignore
  window.__refreshLoopPrevented = false
  // @ts-ignore
  window.__forceDisableInitialization = false

  // Clear sessionStorage flags
  try {
    sessionStorage.removeItem(REFRESH_LOOP_STORAGE_KEY)
    sessionStorage.removeItem(INIT_DISABLED_KEY)
  } catch (e) {
    console.error("Failed to clear sessionStorage flags:", e)
  }
}

export default {
  isRefreshLoopFixed,
  markRefreshLoopFixed,
  isInitializationDisabled,
  disableInitialization,
  resetRefreshPrevention,
}