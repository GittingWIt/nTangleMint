"use client"

import { useState, useEffect, useCallback } from "react"
import { loadMerchantPrograms } from "@/lib/program-loader"
import { debugLog } from "@/lib/debug"

interface UseBSVProgramsOptions {
  merchantAddress?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useBSVPrograms(options: UseBSVProgramsOptions = {}) {
  const { merchantAddress, autoRefresh = false, refreshInterval = 30000 } = options
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPrograms = useCallback(async () => {
    if (!merchantAddress) {
      setPrograms([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      debugLog("program-loader", `Loading programs for merchant: ${merchantAddress}`)
      const merchantPrograms = await loadMerchantPrograms(merchantAddress)

      setPrograms(merchantPrograms)
      debugLog("program-loader", `Loaded ${merchantPrograms.length} programs`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load programs"
      setError(errorMessage)
      debugLog("program-loader", `Error loading programs: ${errorMessage}`, err, "error")
    } finally {
      setIsLoading(false)
    }
  }, [merchantAddress])

  useEffect(() => {
    loadPrograms()

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(loadPrograms, refreshInterval)
      return () => clearInterval(intervalId)
    }
    // FIX: Ensure all code paths return a value
    return undefined
  }, [loadPrograms, autoRefresh, refreshInterval])

  const refresh = useCallback(() => {
    return loadPrograms()
  }, [loadPrograms])

  return {
    programs,
    isLoading,
    error,
    refresh,
  }
}