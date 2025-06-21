"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { loadAllPrograms } from "@/lib/program-loader"
import { debug } from "@/lib/debug"
import { isRefreshLoopFixed, isInitializationDisabled } from "@/lib/refresh-prevention"

interface UseProgramsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  merchantAddress?: string
}

export function usePrograms(options: UseProgramsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 10000, merchantAddress } = options
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const refreshingRef = useRef(false)
  const lastRefreshTimeRef = useRef(Date.now())
  const refreshCountRef = useRef(0)
  const mountCountRef = useRef(0)

  // Maximum number of refreshes to prevent loops
  const MAX_REFRESHES = 2

  // Track mount count to detect potential refresh loops
  useEffect(() => {
    mountCountRef.current += 1

    // If mounting too many times, there might be a refresh loop
    if (mountCountRef.current > 3) {
      debug(`WARNING: usePrograms mounted ${mountCountRef.current} times - possible refresh loop`)
    }

    debug(`usePrograms mounted (count: ${mountCountRef.current})`)

    return () => {
      debug("usePrograms unmounted")
    }
  }, [])

  const refresh = useCallback(async () => {
    // CRITICAL: Check for refresh loop prevention
    if (isInitializationDisabled()) {
      debug("usePrograms: Initialization disabled, skipping refresh")
      setIsLoading(false)
      return
    }

    // Prevent too many refreshes
    if (refreshCountRef.current >= MAX_REFRESHES) {
      debug(`usePrograms: Maximum refresh count (${MAX_REFRESHES}) reached, blocking further refreshes`)
      setIsLoading(false)
      return
    }

    // Prevent concurrent refreshes
    if (refreshingRef.current) {
      setIsLoading(false)
      return
    }
    refreshingRef.current = true

    // Throttle refreshes
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current
    if (timeSinceLastRefresh < 2000) {
      // Minimum 2 seconds between refreshes
      debug(`usePrograms: Throttling refresh, last refresh was ${timeSinceLastRefresh}ms ago`)
      refreshingRef.current = false
      setIsLoading(false)
      return
    }

    lastRefreshTimeRef.current = now
    refreshCountRef.current++

    try {
      setIsLoading(true)
      setError(null)

      let loadedPrograms = []

      // If merchantAddress is provided, load programs for that merchant
      if (merchantAddress) {
        debug(`usePrograms: Loading programs for merchant ${merchantAddress}`)

        // Get all programs first
        const allPrograms = loadAllPrograms()

        // Filter for the specific merchant
        loadedPrograms = allPrograms.filter((p) => p.merchantAddress === merchantAddress)

        debug(
          `usePrograms: Filtered ${loadedPrograms.length} programs for merchant ${merchantAddress} from ${allPrograms.length} total programs`,
        )
      } else {
        // Otherwise, load all programs
        loadedPrograms = loadAllPrograms()
        debug(`usePrograms: Loaded ${loadedPrograms.length} total programs`)
      }

      setPrograms(loadedPrograms)
      debug(`usePrograms: Loaded ${loadedPrograms.length} programs (refresh #${refreshCountRef.current})`)
    } catch (err) {
      console.error("Error loading programs:", err)
      setError("Failed to load programs")
    } finally {
      setIsLoading(false)
      refreshingRef.current = false
    }
  }, [merchantAddress])

  useEffect(() => {
    // Skip if already initialized
    if (initializedRef.current) return
    initializedRef.current = true

    // CRITICAL: Check for refresh loop prevention
    if (isInitializationDisabled()) {
      debug("usePrograms: Initialization disabled, skipping initial load")
      setIsLoading(false)
      return
    }

    // Check if refresh loop fix has been applied
    if (!isRefreshLoopFixed()) {
      debug("usePrograms: Refresh loop fix not applied, applying now")
      // This will be handled by the refresh-prevention.ts module
    }

    debug("usePrograms: Initial load")

    // Add a slight delay to initial load to prevent immediate refresh
    setTimeout(() => {
      refresh()
    }, 100)

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | undefined

    if (autoRefresh && refreshInterval > 0) {
      debug(`usePrograms: Setting up auto-refresh every ${refreshInterval}ms`)
      intervalId = setInterval(() => {
        // Only auto-refresh if we haven't hit the limit
        if (refreshCountRef.current < MAX_REFRESHES) {
          debug("usePrograms: Auto-refreshing programs")
          refresh()
        } else {
          // Clear interval if we've hit the limit
          if (intervalId) {
            clearInterval(intervalId)
            debug("usePrograms: Cleared auto-refresh interval due to refresh limit")
          }
        }
      }, refreshInterval)
    }

    // Set up event listener for program updates with throttling
    const handleProgramsUpdated = () => {
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current

      if (timeSinceLastRefresh > 5000 && refreshCountRef.current < MAX_REFRESHES) {
        // Minimum 5 seconds for event-based refreshes
        debug("usePrograms: programsUpdated event detected, refreshing programs")
        refresh()
      } else {
        debug(`usePrograms: Ignoring programsUpdated event, too soon or too many refreshes`)
      }
    }

    window.addEventListener("programsUpdated", handleProgramsUpdated)

    return () => {
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
      debug("usePrograms: Cleanup")
    }
  }, [refresh, autoRefresh, refreshInterval])

  return {
    programs,
    isLoading,
    error,
    refresh: () => {
      // Reset refresh count when manually refreshing
      refreshCountRef.current = 0
      return refresh()
    },
  }
}