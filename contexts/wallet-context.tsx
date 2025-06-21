"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface WalletContextType {
  walletAddress: string | null
  setWalletAddress: (address: string | null) => void
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  setWalletAddress: () => {},
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
})

interface WalletProviderProps {
  children: React.ReactNode
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const isConnected = !!walletAddress

  useEffect(() => {
    const getWalletData = () => {
      try {
        const data = localStorage.getItem("walletData")
        return data ? JSON.parse(data) : null
      } catch {
        return null
      }
    }

    const storedData = getWalletData()
    if (storedData && storedData.address) {
      setWalletAddress(storedData.address)
    }
  }, [])

  const connectWallet = useCallback(async () => {
    try {
      // Get existing wallet data from localStorage
      const existingData = localStorage.getItem("walletData")
      if (existingData) {
        const walletData = JSON.parse(existingData)
        if (walletData.publicAddress) {
          setWalletAddress(walletData.publicAddress)
          return
        }
      }

      // If no existing wallet, user needs to create/restore one
      console.log("No wallet found - user should create or restore a wallet")
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null)
    localStorage.removeItem("walletData")
  }, [])

  const value: WalletContextType = {
    walletAddress,
    setWalletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

const useWallet = () => {
  return useContext(WalletContext)
}

export { WalletProvider, useWallet }