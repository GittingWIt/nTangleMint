"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getWalletData } from "@/lib/storage"
import { canAccessRoute, getDefaultRoute, isPublicRoute } from "@/lib/routes"

// Assuming MERCHANT_PATHS is defined elsewhere, e.g., in a config file.
const MERCHANT_PATHS = ["/merchant", "/merchant-dashboard"]

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const checkAccess = async () => {
      // Skip check for public routes
      if (isPublicRoute(pathname)) {
        return
      }

      try {
        const walletData = await getWalletData()

        // Check if it's a merchant path and handle accordingly
        const isMerchantPath = MERCHANT_PATHS.some((path) => pathname.startsWith(path))
        if (isMerchantPath && (!walletData || walletData.type !== "merchant")) {
          if (mounted) {
            router.replace("/wallet-generation")
          }
          return
        }

        // If we can't access the current route with our wallet data
        if (!canAccessRoute(pathname, walletData)) {
          // Redirect to appropriate route based on wallet state
          const defaultRoute = getDefaultRoute(walletData)
          console.log(`[RouteGuard] Redirecting to ${defaultRoute}`)
          if (mounted) {
            router.replace(defaultRoute)
          }
        }
      } catch (error) {
        console.error("[RouteGuard] Error checking route access:", error)
        if (mounted) {
          router.replace("/wallet-generation")
        }
      }
    }

    checkAccess()

    return () => {
      mounted = false
    }
  }, [pathname, router])

  return children
}