/**
 * Comprehensive Browser Utility
 * 
 * This file consolidates browser-related utilities from:
 * - lib/browser.ts
 * - lib/utils/browser-utils.ts
 * - browser-detection.ts
 * 
 * Provides SSR-safe access to browser APIs and detection capabilities
 */

// ======================================================
// Core Detection Functions
// ======================================================

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Check if code is running on the server (Node.js)
 */
export function isServer(): boolean {
  return !isBrowser()
}

/**
 * Execute a function only in the browser environment
 * @param fn Function to execute in browser
 * @param fallback Optional fallback value to return on server
 */
export function onlyInBrowser<T>(fn: () => T, fallback?: T): T | undefined {
  if (isBrowser()) {
    return fn()
  }
  return fallback
}

// ======================================================
// Safe Object Access
// ======================================================

/**
 * Safe window object access
 * Returns the window object if in browser, or null if on server
 */
export function getWindow(): Window | null {
  return isBrowser() ? window : null
}

/**
 * Safe document object access
 * Returns the document object if in browser, or null if on server
 */
export function getDocument(): Document | null {
  return isBrowser() ? document : null
}

/**
 * Safe navigator object access
 * Returns the navigator object if in browser, or null if on server
 */
export function getNavigator(): Navigator | null {
  return isBrowser() ? navigator : null
}

/**
 * Safe access to window.location
 * Returns null on server
 */
export function getLocation(): Location | null {
  return isBrowser() ? window.location : null
}

/**
 * Safe access to current URL
 * Returns empty string on server
 */
export function getCurrentUrl(): string {
  return isBrowser() ? window.location.href : ''
}

// ======================================================
// Storage Utilities
// ======================================================

/**
 * Safely access localStorage with proper checks
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (!isBrowser()) return null
      return localStorage.getItem(key)
    } catch (error: any) {
      console.error(`Error getting item ${key} from localStorage:`, error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (!isBrowser()) return false
      localStorage.setItem(key, value)
      return true
    } catch (error: any) {
      console.error(`Error setting item ${key} in localStorage:`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (!isBrowser()) return false
      localStorage.removeItem(key)
      return true
    } catch (error: any) {
      console.error(`Error removing item ${key} from localStorage:`, error)
      return false
    }
  },

  getJSON: <T>(key: string): T | null => {
    try {
      if (!isBrowser()) return null
      const value = localStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error: any) {
      console.error(`Error getting and parsing item ${key} from localStorage:`, error)
      return null
    }
  },

  setJSON: <T>(key: string, value: T): boolean => {
    try {
      if (!isBrowser()) return false
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error: any) {
      console.error(`Error setting item ${key} as JSON in localStorage:`, error)
      return false
    }
  },
}

/**
 * Safely access sessionStorage with proper checks
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (!isBrowser()) return null
      return sessionStorage.getItem(key)
    } catch (error: any) {
      console.error(`Error getting item ${key} from sessionStorage:`, error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (!isBrowser()) return false
      sessionStorage.setItem(key, value)
      return true
    } catch (error: any) {
      console.error(`Error setting item ${key} in sessionStorage:`, error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (!isBrowser()) return false
      sessionStorage.removeItem(key)
      return true
    } catch (error: any) {
      console.error(`Error removing item ${key} from sessionStorage:`, error)
      return false
    }
  },

  getJSON: <T>(key: string): T | null => {
    try {
      if (!isBrowser()) return null
      const value = sessionStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error: any) {
      console.error(`Error getting and parsing item ${key} from sessionStorage:`, error)
      return null
    }
  },

  setJSON: <T>(key: string, value: T): boolean => {
    try {
      if (!isBrowser()) return false
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error: any) {
      console.error(`Error setting item ${key} as JSON in sessionStorage:`, error)
      return false
    }
  },
}

/**
 * Detect if the current browser supports localStorage
 */
export function hasLocalStorage(): boolean {
  if (!isBrowser()) return false
  
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Detect if the current browser supports sessionStorage
 */
export function hasSessionStorage(): boolean {
  if (!isBrowser()) return false
  
  try {
    const testKey = '__storage_test__'
    sessionStorage.setItem(testKey, testKey)
    sessionStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Detect if the current browser supports IndexedDB
 */
export function hasIndexedDB(): boolean {
  if (!isBrowser()) return false
  return typeof window.indexedDB !== 'undefined'
}

// ======================================================
// DOM Utilities
// ======================================================

/**
 * Safely access document with proper checks
 */
export const safeDocument = {
  getTitle: (): string | null => {
    try {
      if (!isBrowser()) return null
      return document.title
    } catch (error: any) {
      console.error("Error getting document title:", error)
      return null
    }
  },

  setTitle: (title: string): boolean => {
    try {
      if (!isBrowser()) return false
      document.title = title
      return true
    } catch (error: any) {
      console.error("Error setting document title:", error)
      return false
    }
  },

  querySelector: <T extends Element>(selector: string): T | null => {
    try {
      if (!isBrowser()) return null
      return document.querySelector<T>(selector)
    } catch (error: any) {
      console.error(`Error querying selector ${selector}:`, error)
      return null
    }
  },

  querySelectorAll: <T extends Element>(selector: string): NodeListOf<T> | null => {
    try {
      if (!isBrowser()) return null
      return document.querySelectorAll<T>(selector)
    } catch (error: any) {
      console.error(`Error querying all selector ${selector}:`, error)
      return null
    }
  },
}

/**
 * Safely navigate to a URL
 */
export function safeNavigate(url: string): void {
  if (isBrowser()) {
    window.location.href = url
  }
}

// ======================================================
// Event Utilities
// ======================================================

/**
 * Safely dispatch a custom event
 */
export function dispatchCustomEvent(eventName: string, detail?: any): boolean {
  try {
    if (!isBrowser()) return false
    const event = new CustomEvent(eventName, { detail })
    window.dispatchEvent(event)
    return true
  } catch (error: any) {
    console.error(`Error dispatching custom event ${eventName}:`, error)
    return false
  }
}

/**
 * Safely add an event listener
 */
export function safeAddEventListener(
  target: EventTarget | null,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): boolean {
  try {
    if (!target) return false
    target.addEventListener(event, handler, options)
    return true
  } catch (error: any) {
    console.error(`Error adding event listener for ${event}:`, error)
    return false
  }
}

/**
 * Safely remove an event listener
 */
export function safeRemoveEventListener(
  target: EventTarget | null,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): boolean {
  try {
    if (!target) return false
    target.removeEventListener(event, handler, options)
    return true
  } catch (error: any) {
    console.error(`Error removing event listener for ${event}:`, error)
    return false
  }
}

// ======================================================
// Browser Detection
// ======================================================

/**
 * Get browser information (name and version)
 * Returns null on server
 */
export function getBrowserInfo(): { name: string; version: string } | null {
  if (!isBrowser()) return null
  
  const userAgent = navigator.userAgent
  
  // Detect browser name and version
  if (userAgent.indexOf("Firefox") > -1) {
    const version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || ''
    return { name: 'Firefox', version }
  } else if (userAgent.indexOf("Edge") > -1) {
    const version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || ''
    return { name: 'Edge', version }
  } else if (userAgent.indexOf("Chrome") > -1) {
    const version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || ''
    return { name: 'Chrome', version }
  } else if (userAgent.indexOf("Safari") > -1) {
    const version = userAgent.match(/Safari\/([0-9.]+)/)?.[1] || ''
    return { name: 'Safari', version }
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
    const version = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/)?.[1] || ''
    return { name: 'Internet Explorer', version }
  }
  
  return { name: 'Unknown', version: '0' }
}

/**
 * Check if the current device is mobile
 * Returns false on server
 */
export function isMobileDevice(): boolean {
  if (!isBrowser()) return false
  
  const userAgent = navigator.userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

/**
 * Check if the current device is a tablet
 * Returns false on server
 */
export function isTabletDevice(): boolean {
  if (!isBrowser()) return false
  
  const userAgent = navigator.userAgent
  return /(iPad|Android(?!.*Mobile))/i.test(userAgent)
}

/**
 * Check if the current device is a desktop
 * Returns false on server
 */
export function isDesktopDevice(): boolean {
  if (!isBrowser()) return false
  return !isMobileDevice() && !isTabletDevice()
}

/**
 * Get the current device type
 * Returns 'server' on server
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'server' {
  if (!isBrowser()) return 'server'
  if (isMobileDevice()) return 'mobile'
  if (isTabletDevice()) return 'tablet'
  return 'desktop'
}

// ======================================================
// Feature Detection
// ======================================================

/**
 * Check if the browser supports touch events
 */
export function supportsTouch(): boolean {
  if (!isBrowser()) return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Check if the browser supports WebGL
 */
export function supportsWebGL(): boolean {
  if (!isBrowser()) return false
  
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (e) {
    return false
  }
}

/**
 * Check if the browser supports the Web Share API
 */
export function supportsWebShare(): boolean {
  if (!isBrowser()) return false
  return 'share' in navigator
}

// Export a default object for convenience
export default {
  isBrowser,
  isServer,
  onlyInBrowser,
  safeLocalStorage,
  safeSessionStorage,
  safeDocument,
  safeNavigate,
  dispatchCustomEvent,
  getBrowserInfo,
  isMobileDevice,
}