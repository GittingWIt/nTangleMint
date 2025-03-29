/**
 * Optimized navigation utilities for better performance
 */

// Global flag to track if navigation is in progress
let navigationInProgress = false

/**
 * Navigate to a URL with optimized performance
 * @param url The URL to navigate to
 * @param options Optional navigation options
 */
export function safeNavigate(url: string, options?: { replace?: boolean; timeout?: number }) {
  // If navigation is already in progress, don't start another one
  if (navigationInProgress) {
    console.log("Navigation already in progress, ignoring request to:", url)
    return
  }

  // Set the flag to prevent multiple navigations
  navigationInProgress = true
  ;(window as any)._navigationInProgress = true

  // Default timeout is 100ms - reduced for better performance
  const timeout = options?.timeout || 100

  // Use a shorter timeout for better performance
  setTimeout(() => {
    try {
      if (options?.replace) {
        window.location.replace(url)
      } else {
        window.location.href = url
      }
    } catch (error) {
      console.error("Navigation error:", error)
      // Reset the flag in case of error
      navigationInProgress = false
      ;(window as any)._navigationInProgress = false
    }
  }, timeout)

  // Reset the flag after a reasonable time in case navigation doesn't complete
  setTimeout(() => {
    navigationInProgress = false
    ;(window as any)._navigationInProgress = false
  }, 3000) // Reduced from 5000ms to 3000ms
}