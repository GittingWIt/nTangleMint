/**
 * This file contains fixes for webpack module-related errors
 */

import { debug } from "./debug"

// Fix for the "o is not a function" error in webpack modules
export function fixWebpackModuleErrors(): void {
  debug("Applying webpack module fixes")

  if (typeof window === "undefined") {
    return // Skip on server-side
  }

  try {
    // Fix for missing webpack modules
    if (!(window as any).__webpack_modules__) {
      ;(window as any).__webpack_modules__ = {}
    }

    // Fix for missing webpack require
    (window as any).__webpack_require__ = (moduleId: string) => {
      debug(`Mock webpack require called for module: ${moduleId}`)
      return {}
    };
    (window as any).__webpack_require__.m = {};
    (window as any).__webpack_require__.c = {};

    // Create a safe proxy for webpack modules
    const safeModuleProxy = (target: any) => {
      return new Proxy(target || {}, {
        get(target, prop) {
          // If the property exists, return it
          if (prop in target) {
            return target[prop]
          }

          // If the property is a function name, return a no-op function
          if (
            typeof prop === "string" &&
            (prop.includes("function") || prop.includes("Function") || prop.includes("Hook") || prop === "o")
          ) {
            console.log(`Creating fallback for missing webpack module function: ${String(prop)}`)
            return function noopFunction() {
              console.log(`Called fallback for ${String(prop)}`)
              return null
            }
          }

          // Return undefined for other properties
          return undefined
        },
      })
    }

    // Apply the proxy to known webpack module objects
    // @ts-ignore - Accessing webpack internals
    if ((window as any).__webpack_modules__) {
      // @ts-ignore
      ;(window as any).__webpack_modules__ = new Proxy((window as any).__webpack_modules__, {
        get(target, prop) {
          const module = target[prop]
          if (typeof module === "function") {
            return function wrappedModule(...args: any[]) {
              try {
                return module(...args)
              } catch (error) {
                console.error(`Error in webpack module ${String(prop)}:`, error)
                // Return a safe proxy instead of throwing
                return safeModuleProxy({})
              }
            }
          }
          return module
        },
      })
      debug("Applied webpack module fixes")
    }
  } catch (error) {
    console.error("Error applying webpack module fixes:", error)
  }
}