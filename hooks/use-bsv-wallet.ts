"use client"

import { useState, useEffect } from "react"
import { debugLog } from "@/lib/debug"

interface BSVWalletData {
  publicAddress: string
  type: "customer" | "merchant"
  businessName?: string
  privateKey?: string
  mnemonic?: string
}

/**
 * BSV-first wallet hook - replaces multiple wallet-related hooks
 * Directly integrates with BSV blockchain for wallet state
 */
export function useBSVWallet() {
  const [walletData, setWalletData] = useState<BSVWalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWalletFromBSV()

    // Listen for wallet updates
    const handleWalletUpdate = () => loadWalletFromBSV()
    window.addEventListener("bsvWalletUpdated", handleWalletUpdate)
    window.addEventListener("bsvWalletCleared", handleWalletUpdate)

    return () => {
      window.removeEventListener("bsvWalletUpdated", handleWalletUpdate)
      window.removeEventListener("bsvWalletCleared", handleWalletUpdate)
    }
  }, [])

  const loadWalletFromBSV = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // TODO: Replace with BSV Rust library call
      // const bsvWallet = await bsv_rust::get_active_wallet()

      // For now, check localStorage for active session
      const sessionData = localStorage.getItem("bsv-wallet-session")
      if (sessionData) {
        const session = JSON.parse(sessionData)
        setWalletData({
          publicAddress: session.address,
          type: session.type,
          businessName: session.businessName,
          privateKey: session.privateKey,
          mnemonic: session.mnemonic,
        })
        debugLog("bsv-wallet", "Wallet loaded from session")
      } else {
        setWalletData(null)
        debugLog("bsv-wallet", "No active wallet session")
      }
    } catch (err) {
      console.error("Error loading BSV wallet:", err)
      setError("Failed to load wallet from BSV blockchain")
      setWalletData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearWallet = async () => {
    try {
      // TODO: Replace with BSV Rust library call
      // await bsv_rust::clear_wallet_session()

      localStorage.removeItem("bsv-wallet-session")
      setWalletData(null)
      window.dispatchEvent(new Event("bsvWalletCleared"))
      debugLog("bsv-wallet", "Wallet session cleared")
    } catch (err) {
      console.error("Error clearing wallet:", err)
      setError("Failed to clear wallet session")
    }
  }

  return {
    walletData,
    isLoading,
    error,
    clearWallet,
    refresh: loadWalletFromBSV,
  }
}