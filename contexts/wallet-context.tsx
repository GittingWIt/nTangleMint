"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { getWalletData } from "@/lib/storage"
import { walletState, trackComponentMount } from "@/lib/wallet-sync"
import { debug } from "@/lib/debug"
import type { WalletData } from "@/types"

interface WalletContextType {
  wallet: WalletData | null
  isLoading: boolean
  error: string | null
  refreshWallet: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  isLoading: true,
  error: null,
  refreshWallet: async () => {},
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const refreshAttempts = useRef(0)

  // Track component mount for Fast Refresh detection
  useEffect(() => {
    trackComponentMount()
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const refreshWallet = async () => {
    if (!mountedRef.current) return

    try {
      setIsLoading(true)
      setError(null)
      refreshAttempts.current += 1

      debug(`WalletContext: Refreshing wallet data (attempt ${refreshAttempts.current})`)

      // Get data with exponential backoff for retries
      let data: WalletData | null = null
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        data = await getWalletData()
        if (data) break

        retryCount++
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 50
          debug(`WalletContext: Retry ${retryCount} after ${delay}ms`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // Update the shared wallet state
      walletState.setWalletData(data)

      if (!mountedRef.current) return

      if (data) {
        debug("WalletContext: Wallet data found")
        setWallet(data)
      } else {
        debug("WalletContext: No wallet data found")
        setWallet(null)
      }
    } catch (err) {
      if (!mountedRef.current) return

      debug("WalletContext: Error refreshing wallet", err)
      setError(err instanceof Error ? err.message : "Failed to load wallet data")
      walletState.setWalletData(null)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Initial load
  useEffect(() => {
    let isMounted = true

    const initializeWallet = async () => {
      try {
        // First check if wallet state is already initialized
        if (walletState.isInitialized()) {
          const stateWallet = walletState.getWalletData()
          if (stateWallet) {
            setWallet(stateWallet)
            setIsLoading(false)
            return
          }
        }

        // Otherwise refresh from storage
        await refreshWallet()
      } catch (error) {
        debug("WalletContext: Error during initialization", error)
        if (isMounted) {
          setError("Failed to initialize wallet")
          setIsLoading(false)
        }
      }
    }

    initializeWallet()

    return () => {
      isMounted = false
    }
  }, [])

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = walletState.subscribe((data) => {
      if (!mountedRef.current) return

      debug("WalletContext: Received wallet update from state container")
      setWallet(data)
      setIsLoading(false)
    })

    // Listen for wallet updates
    const handleWalletUpdated = () => {
      refreshWallet()
    }

    window.addEventListener("walletUpdated", handleWalletUpdated)

    // Handle storage events directly
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "walletData") {
        refreshWallet()
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      unsubscribe()
      window.removeEventListener("walletUpdated", handleWalletUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return <WalletContext.Provider value={{ wallet, isLoading, error, refreshWallet }}>{children}</WalletContext.Provider>
}

export function useWallet() {
  return useContext(WalletContext)
}