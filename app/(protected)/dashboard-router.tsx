"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

// Simple wallet data interface
interface WalletData {
  publicAddress: string
  type: "merchant" | "customer"
  privateKey?: string
}

export default function DashboardRouter() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const processingRef = useRef(false)
  const redirectedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple executions and redirects
    if (processingRef.current || redirectedRef.current) return
    processingRef.current = true

    const checkWalletAndRedirect = async () => {
      try {
        console.log("DashboardRouter: Running on client-side")

        // Skip if already on wallet-generation page
        if (pathname.includes("/wallet-generation")) {
          console.log("DashboardRouter: Already on wallet-generation page, skipping redirect")
          setIsLoading(false)
          return
        }

        // Skip if already on merchant or user page
        const isOnMerchantPath = pathname.startsWith("/merchant") || pathname.includes("/(protected)/merchant")
        const isOnUserPath = pathname === "/user" || pathname.includes("/(protected)/user")

        // Get wallet data directly from localStorage
        const walletDataStr = localStorage.getItem("walletData")
        let walletData: WalletData | null = null

        if (walletDataStr) {
          try {
            walletData = JSON.parse(walletDataStr)
          } catch (error) {
            console.error("Error parsing wallet data:", error)
            walletData = null
          }
        }

        if (walletData && walletData.publicAddress) {
          console.log("DashboardRouter: Wallet data found", {
            type: walletData.type,
            address: walletData.publicAddress,
          })

          // Route based on wallet type
          if (walletData.type === "merchant" && !isOnMerchantPath && !redirectedRef.current) {
            redirectedRef.current = true
            router.push("/merchant")
            return
          }
          // Handle customer wallets - redirect to user path if not already there
          else if (walletData.type === "customer" && !isOnUserPath && !redirectedRef.current) {
            redirectedRef.current = true
            router.push("/user")
            return
          }
        } else {
          // No wallet data, redirect to wallet generation
          if (!pathname.includes("/wallet-generation") && !redirectedRef.current) {
            redirectedRef.current = true
            router.push("/wallet-generation")
            return
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error in dashboard router:", error)
        setIsLoading(false)
      } finally {
        processingRef.current = false
      }
    }

    checkWalletAndRedirect()

    // Force loading to complete after timeout
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
      processingRef.current = false
    }
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Checking wallet status...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Return null to allow the page to render
  return null
}