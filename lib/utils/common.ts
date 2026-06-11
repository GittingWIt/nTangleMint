/**
 * Debug logging function that only logs in development
 */
export function debug(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Generate a random ID
 */
export function generateId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`
}

/**
 * Generate a program ID with pid_ prefix and 12-character base36
 */
export function generateProgramId(): string {
  // Create 12-character base36 string from random and timestamp
  const random = Math.random().toString(36).substring(2, 8) // 6 chars
  const timestamp = Date.now().toString(36).substring(0, 6) // 6 chars
  return `pid_${random}${timestamp}`
}

/**
 * Format currency for USD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse(json: string, fallback: any = null): any {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

/**
 * Delay execution with Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}