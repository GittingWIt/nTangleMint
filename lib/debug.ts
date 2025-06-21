/**
 * Debug utility that's safe for server-side rendering
 */

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true"

/**
 * Log debug messages only in debug mode
 */
export function debug(...args: any[]): void {
  if (DEBUG_MODE) {
    if (typeof window !== "undefined") {
      console.log("[DEBUG]", ...args)
    }
  }
}

/**
 * Log warnings in debug mode
 */
export function debugWarn(...args: any[]): void {
  if (DEBUG_MODE) {
    if (typeof window !== "undefined") {
      console.warn("[DEBUG WARNING]", ...args)
    }
  }
}

/**
 * Log errors in debug mode
 */
export function debugError(...args: any[]): void {
  if (DEBUG_MODE) {
    if (typeof window !== "undefined") {
      console.error("[DEBUG ERROR]", ...args)
    }
  }
}

/**
 * Time an operation in debug mode
 */
export function debugTime(label: string): () => void {
  if (!DEBUG_MODE || typeof window === "undefined") {
    return () => {}
  }

  console.time(`[DEBUG TIME] ${label}`)
  return () => console.timeEnd(`[DEBUG TIME] ${label}`)
}

/**
 * Log an object in debug mode
 */
export function debugObject(label: string, obj: any): void {
  if (DEBUG_MODE && typeof window !== "undefined") {
    console.group(`[DEBUG OBJECT] ${label}`)
    console.dir(obj)
    console.groupEnd()
  }
}