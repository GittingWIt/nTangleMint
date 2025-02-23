"use client"

import { useState, useEffect } from "react"
import { getWalletData, setWalletData as setStorageWalletData } from "@/lib/storage"
import type { WalletData } from "@/types"

export function useWalletData() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setIsLoading(true)
        const data = await getWalletData()
        if (data) {
          console.log("[useWalletData] Loaded wallet data:", { ...data, mnemonic: "[REDACTED]" })
          setWalletData(data)
          setError(null)
        } else {
          console.log("[useWalletData] No wallet data found")
          setWalletData(null)
        }
      } catch (err) {
        console.error("[useWalletData] Failed to load wallet data:", err)
        setError("Failed to load wallet data")
        setWalletData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletData()

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "walletData") {
        loadWalletData()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("walletUpdated", loadWalletData)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("walletUpdated", loadWalletData)
    }
  }, [])

  const updateWalletData = async (newData: WalletData) => {
    try {
      await setStorageWalletData(newData)
      setWalletData(newData)
      console.log("[useWalletData] Wallet data updated:", { ...newData, mnemonic: "[REDACTED]" })
      window.dispatchEvent(new Event("walletUpdated"))
    } catch (err) {
      console.error("[useWalletData] Failed to update wallet data:", err)
      setError("Failed to update wallet data")
    }
  }

  return {
    walletData,
    isLoading,
    error,
    updateWalletData,
  }
}