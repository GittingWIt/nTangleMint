import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
 * Format currency
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
 * Safely parse JSON
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
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}