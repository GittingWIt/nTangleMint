"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { getWalletData } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type React from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isNavigating = useRef(false)
  const navigationTimeout = useRef<NodeJS.Timeout>()
  const [isChecking, setIsChecking] = useState(true)
  const checkCount = useRef(0)

  useEffect(() => {
    const MAX_CHECKS = 3
    const CHECK_INTERVAL = 2000

    const checkWallet = async () => {
      if (checkCount.current >= MAX_CHECKS) {
        console.error("[Protected Layout] Max check attempts reached")
        window.location.href = "/wallet-generation"
        return
      }

      if (isNavigating.current) {
        console.log("[Protected Layout] Check already in progress")
        return
      }

      try {
        isNavigating.current = true
        checkCount.current++

        const walletData = await getWalletData()
        console.log("[Protected Layout] Check attempt", checkCount.current, "Wallet data:", walletData)

        if (!walletData || !walletData.type || !walletData.publicAddress) {
          console.error("[Protected Layout] Invalid or missing wallet data")
          window.location.href = "/wallet-generation"
          return
        }

        // Extract the current route type (user or merchant)
        const currentRoute = pathname.split("/")[1]
        console.log("[Protected Layout] Current route:", currentRoute, "Wallet type:", walletData.type)

        // Check if we're at the root of protected routes
        if (!currentRoute) {
          console.log("[Protected Layout] At protected root, redirecting to dashboard:", walletData.type)
          window.location.href = `/${walletData.type}`
          return
        }

        // Check if the current route matches the wallet type
        if (currentRoute !== walletData.type) {
          console.log("[Protected Layout] Route mismatch. Current:", currentRoute, "Expected:", walletData.type)
          window.location.href = `/${walletData.type}`
          return
        }

        setIsChecking(false)
        checkCount.current = MAX_CHECKS // Stop further checks
      } catch (err) {
        console.error("[Protected Layout] Error checking wallet:", err)
        if (checkCount.current >= MAX_CHECKS) {
          window.location.href = "/wallet-generation"
        }
      } finally {
        navigationTimeout.current = setTimeout(() => {
          isNavigating.current = false
        }, CHECK_INTERVAL)
      }
    }

    checkWallet()

    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current)
      }
    }
  }, [pathname])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-lg text-muted-foreground">Checking wallet status...</p>
          {checkCount.current > 1 && <p className="text-sm text-muted-foreground">Attempt {checkCount.current} of 3</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}