"use client"

import { useState, useEffect, useCallback } from "react"
import { getWalletData, setWalletData as setStorageWalletData } from "@/lib/storage"
import { STORAGE_EVENTS } from "@/lib/constants"
import type { WalletData } from "@/types"

interface UseWalletDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useWalletData(options: UseWalletDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 10000 } = options
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWalletData = useCallback(async () => {
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
  }, [])

  const updateWalletData = useCallback(async (newData: WalletData) => {
    try {
      await setStorageWalletData(newData)
      setWalletData(newData)
      console.log("[useWalletData] Wallet data updated:", { ...newData, mnemonic: "[REDACTED]" })
    } catch (err) {
      console.error("[useWalletData] Failed to update wallet data:", err)
      setError("Failed to update wallet data")
    }
  }, [])

  // Handle storage sync event
  const handleStorageSync = useCallback((event: CustomEvent<{ wallet: WalletData | null }>) => {
    if (event.detail.wallet) {
      setWalletData(event.detail.wallet)
    }
  }, [])

  useEffect(() => {
    loadWalletData()

    // Add event listeners
    window.addEventListener("storage", (event) => {
      if (event.key === "walletData") {
        loadWalletData()
      }
    })
    window.addEventListener(STORAGE_EVENTS.WALLET_UPDATED, loadWalletData)
    window.addEventListener(STORAGE_EVENTS.STORAGE_SYNC, handleStorageSync as EventListener)

    // Auto-refresh setup
    let refreshTimer: NodeJS.Timeout | undefined
    if (autoRefresh) {
      refreshTimer = setInterval(loadWalletData, refreshInterval)
    }

    return () => {
      window.removeEventListener("storage", (event) => {
        if (event.key === "walletData") {
          loadWalletData()
        }
      })
      window.removeEventListener(STORAGE_EVENTS.WALLET_UPDATED, loadWalletData)
      window.removeEventListener(STORAGE_EVENTS.STORAGE_SYNC, handleStorageSync as EventListener)
      if (refreshTimer) clearInterval(refreshTimer)
    }
  }, [loadWalletData, handleStorageSync, autoRefresh, refreshInterval])

  return {
    walletData,
    isLoading,
    error,
    updateWalletData,
    refresh: loadWalletData,
  }
}