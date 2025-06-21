"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getWalletData } from "@/lib/storage-compat"
import { debug } from "@/lib/debug"

// Import the correct WalletData type
import type { WalletData } from "@/types"

interface WalletVerificationState {
  status: "loading" | "verified" | "error" | "not-found"
  wallet: WalletData | null
  error: string | null
}

/**
 * Custom hook for wallet verification with automatic redirection
 * @param redirectPath Path to redirect to if wallet is not found (default: "/wallet")
 * @returns Wallet verification state and utility functions
 */
export function useWalletVerification(redirectPath = "/wallet") {
  const router = useRouter()
  const [state, setState] = useState<WalletVerificationState>({
    status: "loading",
    wallet: null,
    error: null,
  })
  const mountedRef = useRef(false)
  const verificationAttempts = useRef(0)

  // Track component mount
  useEffect(() => {
    debug("Wallet verification component mounted")
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      debug("Wallet verification component unmounted")
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    debug("Initializing wallet verification...")

    const verifyWallet = async () => {
      if (!isMounted) return

      try {
        verificationAttempts.current += 1
        debug(`Wallet verification attempt ${verificationAttempts.current}`)

        let wallet: WalletData | null = null

        // Try to get wallet data with retries
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && !wallet) {
          try {
            // Cast the result to ensure type compatibility
            const result = await getWalletData()
            if (result) {
              wallet = result as WalletData
              break
            }
          } catch (error) {
            debug(`Retry ${retryCount + 1} failed:`, error)
          }

          retryCount++
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 50
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }

        if (!isMounted) return

        if (!wallet) {
          debug("No wallet data found")
          setState({
            status: "not-found",
            wallet: null,
            error: "No wallet data found. Please connect your wallet.",
          })
          return
        }

        // Verify wallet has required fields
        // Note: We're only checking for publicAddress and type as these are common
        // across different WalletData interfaces
        if (!wallet.publicAddress || !wallet.type) {
          debug("Invalid wallet data:", wallet)
          setState({
            status: "error",
            wallet: null,
            error: "Invalid wallet data. Please reconnect your wallet.",
          })
          return
        }

        debug("Wallet verified successfully")
        setState({
          status: "verified",
          wallet: wallet,
          error: null,
        })
      } catch (err) {
        debug("Wallet verification failed:", err)
        if (isMounted) {
          setState({
            status: "error",
            wallet: null,
            error: err instanceof Error ? err.message : "Failed to verify wallet",
          })
        }
      }
    }

    // Initial verification
    verifyWallet()

    // Listen for wallet updates
    const handleWalletUpdated = () => {
      verifyWallet()
    }

    window.addEventListener("walletUpdated", handleWalletUpdated)

    // Handle storage events directly
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "walletData") {
        verifyWallet()
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      isMounted = false
      window.removeEventListener("walletUpdated", handleWalletUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  // Redirect if wallet is not found and redirectPath is provided
  useEffect(() => {
    if (state.status === "not-found" && redirectPath) {
      debug(`Redirecting to ${redirectPath} due to missing wallet`)
      router.push(redirectPath)
    }
  }, [state.status, redirectPath, router])

  // Add utility functions
  const updateWallet = (newWallet: WalletData) => {
    // Ensure the wallet has required properties
    if (!newWallet.publicAddress || !newWallet.type) {
      debug("Cannot update wallet: missing required properties")
      setState({
        status: "error",
        wallet: null,
        error: "Invalid wallet data: missing required properties",
      })
      return
    }

    // Update wallet in storage
    try {
      // Import directly to avoid circular dependencies
      const { setWalletData } = require("@/lib/storage-compat")
      setWalletData(newWallet)

      setState({
        status: "verified",
        wallet: newWallet,
        error: null,
      })
      debug("Wallet updated successfully")
    } catch (error) {
      debug("Failed to update wallet:", error)
      setState({
        status: "error",
        wallet: null,
        error: "Failed to update wallet data",
      })
    }
  }

  const clearWallet = () => {
    try {
      // Import directly to avoid circular dependencies
      const { clearWalletData } = require("@/lib/storage-compat")
      clearWalletData()

      setState({
        status: "not-found",
        wallet: null,
        error: "Wallet cleared",
      })
      debug("Wallet cleared")
    } catch (error) {
      debug("Failed to clear wallet:", error)
      setState({
        status: "error",
        wallet: null,
        error: "Failed to clear wallet data",
      })
    }
  }

  return {
    ...state,
    update: updateWallet,
    clear: clearWallet,
  }
}

export default useWalletVerification