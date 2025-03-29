"use client"

import { useEffect } from "react"
import { initNavigationOptimizations, preloadPage } from "@/lib/navigation-utils"

export function PerformanceOptimizer() {
  useEffect(() => {
    // Initialize navigation optimizations
    initNavigationOptimizations()

    // Optimize resource loading
    const optimizeResourceLoading = () => {
      // Disconnect observers and clear intervals when page is hidden
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          // Clear any unnecessary timers or observers
          const intervalIds = (window as any)._intervalIds || []
          intervalIds.forEach((id: number) => clearInterval(id))
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      // Preload pages on hover of links
      const linkSelector = 'a[href^="/"], button[onclick*="location"]'
      const handleLinkHover = (event: MouseEvent) => {
        const element = event.target as HTMLElement
        const link = element.closest(linkSelector) as HTMLAnchorElement

        if (link && link.href && link.href.startsWith(window.location.origin)) {
          const path = link.href.replace(window.location.origin, "")
          preloadPage(path)
        }
      }

      document.addEventListener("mouseover", handleLinkHover)

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        document.removeEventListener("mouseover", handleLinkHover)
      }
    }

    optimizeResourceLoading()

    // Track and store interval IDs for cleanup
    const originalSetInterval = window.setInterval
    ;(window as any)._intervalIds = (window as any)._intervalIds || []

    window.setInterval = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
      const id = originalSetInterval(handler, timeout, ...args)
      ;(window as any)._intervalIds.push(id)
      return id
    }

    return () => {
      // Restore original setInterval
      window.setInterval = originalSetInterval
    }
  }, [])

  return null
}