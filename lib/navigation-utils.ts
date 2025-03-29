/**
 * Optimized navigation utilities for better performance
 */

// Global flag to track if navigation is in progress
let navigationInProgress = false

/**
 * Initialize navigation optimizations
 */
export function initNavigationOptimizations() {
  if (typeof window === "undefined") return

  // Preload critical pages
  const criticalPages = ["/user", "/about", "/"]

  // Use requestIdleCallback for non-blocking preloading
  if ("requestIdleCallback" in window) {
    ;(window as any).requestIdleCallback(() => {
      criticalPages.forEach((page) => preloadPage(page))
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      criticalPages.forEach((page) => preloadPage(page))
    }, 1000)
  }

  // Optimize navigation
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Reset any flags when page becomes visible
      navigationInProgress = false
      ;(window as any)._navigationInProgress = false
    }
  })

  console.log("Navigation optimizations initialized")
}

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

/**
 * Preload a page to improve navigation performance
 * @param url The URL to preload
 */
export function preloadPage(url: string) {
  // Skip if already preloaded or empty URL
  if (!url) return

  // Cache for preloaded pages to avoid duplicates
  const preloadedPages = ((window as any)._preloadedPages = (window as any)._preloadedPages || new Set<string>())

  // Skip if already preloaded
  if (preloadedPages.has(url)) return

  try {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = url
    document.head.appendChild(link)
    preloadedPages.add(url)
    console.log(`Preloaded page: ${url}`)
  } catch (error) {
    console.error("Error preloading page:", error)
  }
}