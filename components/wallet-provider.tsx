"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import {
  getWalletData,
  setWalletData as storeWalletData,
  clearWalletData as clearStoredWalletData,
  debugStorage,
} from "@/lib/storage"
import type { WalletData } from "@/types"
import { usePathname } from "next/navigation"

// Define paths directly in this file to avoid import errors
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/test-bsv",
  "/test-bsv/lifecycle-test",
  "/test-bsv/comprehensive-test",
  "/test-bsv/single-test",
  "/wallet-generation",
  "/wallet-restoration",
]

const MERCHANT_PATHS = [
  "/merchant",
  "/merchant/dashboard",
  "/merchant/create-program",
  "/merchant/create-program/punch-card",
  "/merchant/create-program/points",
  "/merchant/create-program/tiered",
  "/merchant/create-program/coalition",
  "/merchant/create-program/coupon-book",
]

interface WalletContextType {
  walletData: WalletData | null
  setWalletData: (data: WalletData) => Promise<void>
  clearWalletData: () => Promise<void>
  isLoading: boolean
  refreshWallet: () => Promise<WalletData | null> // Changed from Promise<void> to Promise<WalletData | null>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const DEBUG = process.env.NODE_ENV === "development"

function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[WalletProvider Debug]:", ...args)
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletData, setWalletDataState] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  const shouldSkipInit = useCallback(() => {
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return true
    if (MERCHANT_PATHS.some((path) => pathname.startsWith(path))) return true
    return false
  }, [pathname])

  const refreshWallet = useCallback(async () => {
    try {
      if (shouldSkipInit()) {
        setIsLoading(false)
        return null
      }

      setIsLoading(true)
      const data = await getWalletData()
      setWalletDataState(data)
      setIsLoading(false)
      return data
    } catch (err) {
      console.error("Failed to refresh wallet data:", err)
      setIsLoading(false)
      return null
    }
  }, [shouldSkipInit])

  useEffect(() => {
    let mounted = true

    const initWallet = async () => {
      if (!mounted) return

      try {
        if (shouldSkipInit()) {
          setIsLoading(false)
          return
        }

        debug("Initializing wallet provider")
        const data = await getWalletData()

        if (mounted) {
          setWalletDataState(data)
          setIsLoading(false)

          if (DEBUG) {
            debug("Wallet data loaded:", data ? "exists" : "not found")
            debugStorage()
          }
        }
      } catch (err) {
        console.error("Wallet provider initialization error:", err)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initWallet()

    return () => {
      mounted = false
    }
  }, [shouldSkipInit])

  useEffect(() => {
    const handleWalletUpdate = () => {
      debug("Wallet update detected")
      refreshWallet()
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("storage", handleWalletUpdate)

    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("storage", handleWalletUpdate)
    }
  }, [refreshWallet])

  const setWalletData = async (data: WalletData) => {
    try {
      await storeWalletData(data)
      setWalletDataState(data)
    } catch (err) {
      console.error("Failed to set wallet data:", err)
      throw err
    }
  }

  const clearWalletData = async () => {
    try {
      await clearStoredWalletData()
      setWalletDataState(null)
    } catch (err) {
      console.error("Failed to clear wallet data:", err)
      throw err
    }
  }

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData,
        clearWalletData,
        isLoading,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}