/**
 * Browser Utilities
 * SSR-safe access to browser APIs and storage
 */

import { isBrowser } from "./common"

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Safely access localStorage with proper checks
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (!isBrowser()) return null
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error)
      return null
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (!isBrowser()) return false
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error)
      return false
    }
  },

  removeItem(key: string): boolean {
    try {
      if (!isBrowser()) return false
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error)
      return false
    }
  },

  getJSON<T>(key: string): T | null {
    try {
      if (!isBrowser()) return null
      const value = localStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Error parsing item ${key} from localStorage:`, error)
      return null
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      if (!isBrowser()) return false
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting item ${key} as JSON in localStorage:`, error)
      return false
    }
  },

  clear(): boolean {
    try {
      if (!isBrowser()) return false
      localStorage.clear()
      return true
    } catch (error) {
      console.error("Error clearing localStorage:", error)
      return false
    }
  },
}

/**
 * Safely access sessionStorage with proper checks
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (!isBrowser()) return null
      return sessionStorage.getItem(key)
    } catch (error) {
      console.error(`Error getting item ${key} from sessionStorage:`, error)
      return null
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      if (!isBrowser()) return false
      sessionStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error setting item ${key} in sessionStorage:`, error)
      return false
    }
  },

  removeItem(key: string): boolean {
    try {
      if (!isBrowser()) return false
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing item ${key} from sessionStorage:`, error)
      return false
    }
  },

  getJSON<T>(key: string): T | null {
    try {
      if (!isBrowser()) return null
      const value = sessionStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Error parsing item ${key} from sessionStorage:`, error)
      return null
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      if (!isBrowser()) return false
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error setting item ${key} as JSON in sessionStorage:`, error)
      return false
    }
  },

  clear(): boolean {
    try {
      if (!isBrowser()) return false
      sessionStorage.clear()
      return true
    } catch (error) {
      console.error("Error clearing sessionStorage:", error)
      return false
    }
  },
}

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Detect if the current browser supports localStorage
 */
export function hasLocalStorage(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Detect if the current browser supports sessionStorage
 */
export function hasSessionStorage(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = "__storage_test__"
    sessionStorage.setItem(testKey, testKey)
    sessionStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (!isBrowser()) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Get the current device type
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" | "server" {
  if (!isBrowser()) return "server"
  const ua = navigator.userAgent
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "mobile"
  if (/(iPad|Android(?!.*Mobile))/i.test(ua)) return "tablet"
  return "desktop"
}