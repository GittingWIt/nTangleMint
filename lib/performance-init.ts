/**
 * Performance initialization utilities
 */

// Cache for preloaded pages
const preloadedPages = new Set<string>()

/**
 * Preload a page to improve navigation performance
 * @param url The URL to preload
 */
export function preloadPage(url: string) {
  // Skip if already preloaded
  if (preloadedPages.has(url)) return

  try {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = url
    document.head.appendChild(link)
    preloadedPages.add(url)
  } catch (error) {
    console.error("Error preloading page:", error)
  }
}

/**
 * Initialize performance optimizations
 */
export function initPerformance() {
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
      ;(window as any)._navigationInProgress = false
    }
  })

  // Preload pages on hover
  document.addEventListener("mouseover", (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement

    if (link && link.href && link.href.startsWith(window.location.origin)) {
      const path = link.href.replace(window.location.origin, "")
      preloadPage(path)
    }
  })

  console.log("Performance optimizations initialized")
}