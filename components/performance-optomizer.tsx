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

    // Track and store interval IDs for cleanup - using a simpler approach
    // that doesn't involve overriding window.setInterval
    const intervalIds: number[] = []

    // Create a tracking function instead of overriding setInterval
    const trackInterval = (callback: Function, ms?: number, ...args: any[]) => {
      const id = window.setInterval(() => {
        callback(...args)
      }, ms)
      intervalIds.push(id)
      return id
    }

    // Store the tracking function and interval IDs separately - fixed syntax
    ;(window as any)._trackInterval = trackInterval
    ;(window as any)._intervalIds = intervalIds

    return () => {
      // Clean up all intervals on unmount
      intervalIds.forEach((id) => window.clearInterval(id))
    }
  }, [])

  return null
}