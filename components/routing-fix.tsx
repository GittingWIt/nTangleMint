"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { debug } from "@/lib/debug"

export function RoutingFix() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    try {
      const walletType = localStorage.getItem("wallet_type")
      const walletData = localStorage.getItem("walletData")

      if (!walletType || !walletData) return

      debug(`RoutingFix: Current path: ${pathname}, Wallet type: ${walletType}`)

      // If we're on a merchant route but have a customer wallet
      if (pathname.startsWith("/merchant") && walletType === "customer") {
        debug("RoutingFix: Redirecting customer from merchant route to home")
        router.replace("/")
        return
      }

      // If we're on a customer route but have a merchant wallet
      if (pathname.startsWith("/user") && walletType === "merchant") {
        debug("RoutingFix: Redirecting merchant from customer route to merchant dashboard")
        router.replace("/merchant")
        return
      }

      // Fix dashboard routing
      if (pathname === "/dashboard") {
        if (walletType === "customer") {
          debug("RoutingFix: Redirecting customer from generic dashboard to home")
          router.replace("/")
        } else if (walletType === "merchant") {
          debug("RoutingFix: Redirecting merchant from generic dashboard to merchant dashboard")
          router.replace("/merchant")
        }
      }
    } catch (error) {
      console.error("RoutingFix error:", error)
    }
  }, [pathname, router])

  return null // This component doesn't render anything
}