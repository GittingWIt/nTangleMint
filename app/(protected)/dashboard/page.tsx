"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Simple wallet data interface
interface WalletData {
  publicAddress: string
  type: "merchant" | "customer"
  privateKey?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isRedirecting) return

    const determineCorrectRoute = async () => {
      try {
        setIsRedirecting(true)

        // Get wallet data directly from localStorage
        const walletDataStr = localStorage.getItem("walletData")
        if (!walletDataStr) {
          console.log("No wallet data found, redirecting to wallet generation")
          router.push("/wallet-generation")
          return
        }

        const walletData: WalletData = JSON.parse(walletDataStr)
        if (!walletData.publicAddress) {
          console.log("Invalid wallet data, redirecting to wallet generation")
          router.push("/wallet-generation")
          return
        }

        console.log(`Dashboard routing for address: ${walletData.publicAddress}`)

        // Simple routing based on wallet type
        if (walletData.type === "merchant") {
          console.log("Routing to merchant dashboard")
          router.push("/merchant")
        } else {
          console.log("Routing to customer dashboard")
          router.push("/user")
        }
      } catch (error) {
        console.error("Error in dashboard routing:", error)
        // On error, default to customer dashboard for security
        router.push("/user")
      }
    }

    // Small delay to ensure proper initialization
    setTimeout(determineCorrectRoute, 100)
  }, [router, isRedirecting])

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your wallet...</p>
        </div>
      </div>
    </div>
  )
}