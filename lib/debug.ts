/**
 * Debug utility for consistent logging
 */

const DEBUG_ENABLED = process.env.NODE_ENV !== "production"

/**
 * Log debug messages when not in production
 */
export function debug(message: string, ...args: any[]): void {
  if (DEBUG_ENABLED) {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Log warnings that should be visible in all environments
 */
export function warn(message: string, ...args: any[]): void {
  console.warn(`[WARN] ${message}`, ...args)
}

/**
 * Log errors that should be visible in all environments
 */
export function error(message: string, ...args: any[]): void {
  console.error(`[ERROR] ${message}`, ...args)
}