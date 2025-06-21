"use client"

import { useState, useEffect } from "react"
import { getWalletData } from "@/lib/storage-compat"
import { debug } from "@/lib/utils"

export function useWalletData() {
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadWalletData() {
      try {
        setIsLoading(true)
        debug("useWalletData: Loading wallet data...") // ADDED: Debug log

        const data = await getWalletData()
        setWalletData(data)

        if (data) {
          debug("useWalletData: Wallet data loaded successfully", data) // ADDED: Debug log
        } else {
          debug("useWalletData: No wallet data found") // ADDED: Debug log
        }
      } catch (err) {
        console.error("Error loading wallet data:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletData()
  }, [])

  return { walletData, isLoading, error }
}

// Add an alias export for backward compatibility
export const useWallet = useWalletData