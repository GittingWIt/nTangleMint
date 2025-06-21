"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardClient() {
  const router = useRouter()

  useEffect(() => {
    // Simple function to check wallet type
    const checkWalletType = () => {
      try {
        const walletData = localStorage.getItem("walletData")
        if (!walletData) return null

        const wallet = JSON.parse(walletData)
        return wallet.type
      } catch (error) {
        console.error("Error checking wallet type:", error)
        return null
      }
    }

    // Get wallet type
    const walletType = checkWalletType()

    // Redirect based on wallet type using correct paths
    if (walletType === "merchant") {
      router.push("/merchant")
    } else if (walletType === "customer" || walletType === "user") {
      router.push("/user")
    }
  }, [router])

  return null
}