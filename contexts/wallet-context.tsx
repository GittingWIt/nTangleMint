"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getCurrentWallet, logout } from "@/lib/services/wallet-service"

import type { Wallet } from "@/lib/types"

interface WalletContextType {
  wallet: Wallet | null
  setWallet: (wallet: Wallet | null) => void
  clearWallet: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate wallet from session storage on mount
  useEffect(() => {
    try {
      const savedWallet = getCurrentWallet()
      if (savedWallet) {
        setWallet(savedWallet)
        console.log("[v0] Wallet context hydrated from session storage")
      }
    } catch (error) {
      console.error("[v0] Failed to hydrate wallet context:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearWallet = () => {
    setWallet(null)
    logout() // Clear wallet from session storage
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        setWallet,
        clearWallet,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}