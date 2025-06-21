/**
 * Function safety utilities
 * Helps prevent "X is not a function" errors by providing safe function wrappers
 */

import { debug } from "./debug"

/**
 * Safely calls a function, handling the case where it might not be a function
 * @param fn The function to call
 * @param args Arguments to pass to the function
 * @param fallback Fallback value if fn is not a function
 * @returns The result of calling fn or the fallback value
 */
export function safeCall<T>(fn: any, args: any[] = [], fallback: T): T {
  try {
    if (typeof fn === "function") {
      return fn(...args) as T
    } else {
      debug(`safeCall: Expected a function but got ${typeof fn}`)
      return fallback
    }
  } catch (error) {
    debug(`safeCall error: ${error}`)
    return fallback
  }
}

/**
 * Creates a safe version of a function that won't throw if it's not a function
 * @param fn The function to make safe
 * @param fallback Fallback value if fn is not a function or throws
 * @returns A safe function that returns the fallback if fn is not a function
 */
export function makeSafe<T extends (...args: any[]) => any>(
  fn: any,
  fallback: ReturnType<T>,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    return safeCall<ReturnType<T>>(fn, args, fallback)
  }
}

/**
 * Safely gets a property from an object, ensuring it's a function
 * @param obj The object to get the property from
 * @param prop The property name
 * @param fallback Fallback function if the property is not a function
 * @returns The property as a function or the fallback function
 */
export function safeFunction<T extends (...args: any[]) => any>(obj: any, prop: string, fallback: T): T {
  try {
    if (obj && typeof obj[prop] === "function") {
      return obj[prop] as T
    } else {
      debug(`safeFunction: ${prop} is not a function on the provided object`)
      return fallback
    }
  } catch (error) {
    debug(`safeFunction error for ${prop}: ${error}`)
    return fallback
  }
}

/**
 * Patches an object to ensure a property is a function
 * @param obj The object to patch
 * @param prop The property name
 * @param fallback Fallback function if the property is not a function
 * @returns The original object with the property patched if needed
 */
export function ensureFunction<T extends object, K extends keyof T>(obj: T, prop: K, fallback: T[K]): T {
  if (!obj) return obj

  try {
    if (typeof obj[prop] !== "function") {
      debug(`ensureFunction: Patching ${String(prop)} which is not a function`)
      obj[prop] = fallback
    }
  } catch (error) {
    debug(`ensureFunction error for ${String(prop)}: ${error}`)
    try {
      obj[prop] = fallback
    } catch (e) {
      debug(`Failed to patch ${String(prop)}: ${e}`)
    }
  }

  return obj
}

/**
 * Patches all common functions on an object to ensure they're functions
 * @param obj The object to patch
 * @returns The patched object
 */
export function patchCommonFunctions<T extends object>(obj: T): T {
  if (!obj) return obj

  // Common function names that might be used
  const commonFunctions: Record<string, (...args: any[]) => any> = {
    toString: () => "[object Object]",
    valueOf: () => obj,
    toJSON: () => ({}),
    serialize: () => "{}",
    parse: () => ({}),
    stringify: () => "{}",
    load: () => null,
    save: () => null,
    update: () => null,
    create: () => null,
    delete: () => null,
    get: () => null,
    set: () => null,
  }

  // Patch each common function
  for (const [name, fallback] of Object.entries(commonFunctions)) {
    if (name in obj && typeof obj[name as keyof T] !== "function") {
      debug(`patchCommonFunctions: Patching ${name} which is not a function`)
      try {
        // Use type assertion to avoid TypeScript errors
        ;(obj as any)[name] = fallback
      } catch (e) {
        debug(`Failed to patch ${name}: ${e}`)
      }
    }
  }

  return obj
}

/**
 * Fixes "s is not a function" errors by patching the global scope
 * This is a last resort and should be used carefully
 */
export function fixSIsNotAFunction(): void {
  if (typeof window === "undefined") return

  try {
    debug("Attempting to fix 's is not a function' error")

    // Check if 's' exists in the global scope
    if ((window as any).s !== undefined) {
      debug("Found 's' in global scope, checking if it's a function")

      if (typeof (window as any).s !== "function") {
        debug("'s' is not a function, patching it")

        // Store the original value
        const originalS = (window as any).s

        // Create a safe function that returns the original value when called
        const safeS = (...args: any[]) => {
          if (args.length === 0) return originalS
          return null
        }

        // Copy properties from original to safe function if possible
        if (originalS && typeof originalS === "object") {
          Object.getOwnPropertyNames(originalS).forEach((key) => {
            try {
              ;(safeS as any)[key] = originalS[key]
            } catch (e) {
              debug(`Failed to copy property ${key}: ${e}`)
            }
          })
        }
        // Replace the global 's'
        ;(window as any).s = safeS
        debug("Successfully patched 's' in global scope")
      } else {
        debug("'s' is already a function, no patching needed")
      }
    } else {
      debug("'s' not found in global scope, defining as no-op function")
      // Define 's' as a no-op function if it doesn't exist
      ;(window as any).s = () => null
    }
  } catch (error) {
    debug(`Error fixing 's is not a function': ${error}`)

    // Last resort - define a simple function
    try {
      ;(window as any).s = () => null
      debug("Defined 's' as fallback function after error")
    } catch (e) {
      debug(`Failed to define fallback for 's': ${e}`)
    }
  }
}

/**
 * Fixes "i is not a function" errors by patching the global scope
 * This is a last resort and should be used carefully
 */
export function fixIIsNotAFunction(): void {
  if (typeof window === "undefined") return

  try {
    debug("Attempting to fix 'i is not a function' error")

    // Check if 'i' exists in the global scope
    if ((window as any).i !== undefined) {
      debug("Found 'i' in global scope, checking if it's a function")

      if (typeof (window as any).i !== "function") {
        debug("'i' is not a function, patching it")

        // Store the original value
        const originalI = (window as any).i

        // Create a safe function that returns the original value when called
        const safeI = (...args: any[]) => {
          if (args.length === 0) return originalI
          return null
        }

        // Copy properties from original to safe function if possible
        if (originalI && typeof originalI === "object") {
          Object.getOwnPropertyNames(originalI).forEach((key) => {
            try {
              ;(safeI as any)[key] = originalI[key]
            } catch (e) {
              debug(`Failed to copy property ${key}: ${e}`)
            }
          })
        }
        // Replace the global 'i'
        ;(window as any).i = safeI
        debug("Successfully patched 'i' in global scope")
      } else {
        debug("'i' is already a function, no patching needed")
      }
    } else {
      debug("'i' not found in global scope, defining as no-op function")
      // Define 'i' as a no-op function if it doesn't exist
      ;(window as any).i = () => null
    }
  } catch (error) {
    debug(`Error fixing 'i is not a function': ${error}`)

    // Last resort - define a simple function
    try {
      ;(window as any).i = () => null
      debug("Defined 'i' as fallback function after error")
    } catch (e) {
      debug(`Failed to define fallback for 'i': ${e}`)
    }
  }
}

/**
 * Fix common "X is not a function" errors by patching the global scope
 * This handles multiple common cases like 's', 'i', 'ga', etc.
 */
export function fixCommonNotAFunctionErrors(): void {
  if (typeof window === "undefined") return

  try {
    debug("Fixing common 'X is not a function' errors")

    // List of common globals that might cause "X is not a function" errors
    const commonGlobals = ["s", "i", "ga", "gtag", "fbq", "dataLayer", "analytics", "track", "pixel"]

    for (const name of commonGlobals) {
      if ((window as any)[name] !== undefined && typeof (window as any)[name] !== "function") {
        debug(`Found '${name}' in global scope but it's not a function, patching it`)

        // Store the original value
        const originalValue = (window as any)[name]

        // Create a safe function that returns the original value when called
        const safeFunction = (...args: any[]) => {
          if (args.length === 0) return originalValue
          return null
        }

        // Copy properties from original to safe function if possible
        if (originalValue && typeof originalValue === "object") {
          try {
            Object.getOwnPropertyNames(originalValue).forEach((key) => {
              try {
                ;(safeFunction as any)[key] = originalValue[key]
              } catch (e) {
                debug(`Failed to copy property ${key} from '${name}': ${e}`)
              }
            })
          } catch (e) {
            debug(`Failed to copy properties from '${name}': ${e}`)
          }
        }
        // Replace the global
        ;(window as any)[name] = safeFunction
        debug(`Successfully patched '${name}' in global scope`)
      } else if ((window as any)[name] === undefined) {
        // Define as a no-op function if it doesn't exist
        ;(window as any)[name] = () => null
        debug(`Defined '${name}' as no-op function`)
      }
    }
  } catch (error) {
    debug(`Error fixing common 'X is not a function' errors: ${error}`)
  }
}

export default {
  safeCall,
  makeSafe,
  safeFunction,
  ensureFunction,
  patchCommonFunctions,
  fixSIsNotAFunction,
  fixIIsNotAFunction,
  fixCommonNotAFunctionErrors,
}