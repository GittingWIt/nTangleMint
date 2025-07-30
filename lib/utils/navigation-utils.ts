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
    if (typeof window !== "undefined") {
      const link = document.createElement("link")
      link.rel = "prefetch"
      link.href = url
      document.head.appendChild(link)
      preloadedPages.add(url)
      console.log(`Preloaded page: ${url}`)
    }
  } catch (error) {
    console.error("Error preloading page:", error)
  }
}

/**
 * Navigate to a URL safely with optional timeout and replace options
 * @param url The URL to navigate to
 * @param options Optional configuration for navigation
 */
export function safeNavigate(url: string, options?: { replace?: boolean; timeout?: number }) {
  if (!url) return

  try {
    if (typeof window !== "undefined") {
      const { replace = false, timeout = 0 } = options || {}

      if (timeout > 0) {
        setTimeout(() => {
          if (replace) {
            window.location.replace(url)
          } else {
            window.location.href = url
          }
        }, timeout)
      } else {
        if (replace) {
          window.location.replace(url)
        } else {
          window.location.href = url
        }
      }
    }
  } catch (error) {
    console.error("Error navigating to:", url, error)
  }
}

export function initNavigationOptimizations() {
  // Implementation can be added here if needed
}