/**
 * Safe initialization script
 * Applies function safety measures to prevent common errors
 */

import { debug } from "./debug"
import { fixSIsNotAFunction, patchCommonFunctions } from "./function-safety"

// Flag to track if initialization has run
let safeInitialized = false

/**
 * Initialize function safety measures
 * This prevents "X is not a function" errors
 */
export function initializeSafety(): void {
  if (safeInitialized) return

  try {
    debug("Initializing function safety measures...")

    // Fix "s is not a function" error
    fixSIsNotAFunction()

    // Patch common global objects
    if (typeof window !== "undefined") {
      // Patch localStorage methods
      if (window.localStorage) {
        patchCommonFunctions(window.localStorage)
      }

      // Patch sessionStorage methods
      if (window.sessionStorage) {
        patchCommonFunctions(window.sessionStorage)
      }

      // Patch JSON methods
      if (window.JSON) {
        patchCommonFunctions(window.JSON)
      }
    }

    // Mark as initialized
    safeInitialized = true
    debug("Function safety measures initialized successfully")
  } catch (error) {
    console.error("Error during safety initialization:", error)
  }
}

// Auto-initialize when imported in client components
if (typeof window !== "undefined") {
  initializeSafety()
}

export default {
  initializeSafety,
}