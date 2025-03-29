"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getWalletData } from "@/lib/storage"
import { walletState, trackComponentMount } from "@/lib/wallet-sync"
import { debug } from "@/lib/debug"
import type { WalletData } from "@/types"

interface WalletVerificationState {
  status: "loading" | "verified" | "error" | "not-found"
  wallet: WalletData | null
  error: string | null
}

export function useWalletVerification(redirectPath = "/wallet") {
  const router = useRouter()
  const [state, setState] = useState<WalletVerificationState>({
    status: "loading",
    wallet: null,
    error: null,
  })
  const mountedRef = useRef(false)
  const verificationAttempts = useRef(0)

  // Track component mount for Fast Refresh detection
  useEffect(() => {
    trackComponentMount()
    mountedRef.current = true

    return () => {
      mountedRef.current = false
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

        // Wait for wallet state to be initialized with timeout
        try {
          await walletState.waitForInit(1000)
        } catch (error) {
          debug("Wallet state initialization timeout, proceeding anyway")
        }

        // First check the synchronized state
        let wallet = walletState.getWalletData(true) // true = refresh from storage if needed

        // If not available, try to get it directly with retries
        if (!wallet) {
          debug("Wallet not in shared state, fetching directly")

          let retryCount = 0
          const maxRetries = 3

          while (retryCount < maxRetries && !wallet) {
            try {
              wallet = await getWalletData()
              if (wallet) break
            } catch (error) {
              debug(`Retry ${retryCount + 1} failed:`, error)
            }

            retryCount++
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 50
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }

          // Update shared state if we found it
          if (wallet) {
            walletState.update(wallet)
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

        // Verify wallet type and required fields
        if (wallet.type !== "merchant" || !wallet.publicAddress || !wallet.publicKey) {
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
          wallet,
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

    // Subscribe to wallet state changes
    const unsubscribe = walletState.subscribe((wallet) => {
      if (!isMounted) return

      debug("WalletVerification: Received wallet update from state container")

      if (!wallet) {
        setState({
          status: "not-found",
          wallet: null,
          error: "No wallet data found. Please connect your wallet.",
        })
        return
      }

      if (wallet.type !== "merchant" || !wallet.publicAddress || !wallet.publicKey) {
        setState({
          status: "error",
          wallet: null,
          error: "Invalid wallet data. Please reconnect your wallet.",
        })
        return
      }

      setState({
        status: "verified",
        wallet,
        error: null,
      })
    })

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
      unsubscribe()
      window.removeEventListener("walletUpdated", handleWalletUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  // Redirect if wallet is not found and redirectPath is provided
  useEffect(() => {
    if (state.status === "not-found" && redirectPath) {
      router.push(redirectPath)
    }
  }, [state.status, redirectPath, router])

  return state
}