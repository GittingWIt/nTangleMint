"use client"

import { useState, useEffect, useCallback } from "react"
import type { Program } from "@/types"

interface UseProgramsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  merchantAddress?: string
}

export function usePrograms({
  autoRefresh = false,
  refreshInterval = 10000,
  merchantAddress,
}: UseProgramsOptions = {}) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPrograms = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get all programs from storage
      const storagePrefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_prod_"
      const programsKey = `${storagePrefix}_programs`
      const programsData = localStorage.getItem(programsKey)

      let allPrograms: Program[] = []

      if (programsData) {
        allPrograms = JSON.parse(programsData)
        console.log(`Found ${allPrograms.length} total programs in storage`)
      }

      // Filter programs by merchant address if provided
      const filteredPrograms = merchantAddress
        ? allPrograms.filter((program) => program.merchantAddress === merchantAddress)
        : allPrograms

      console.log(`Fetched ${filteredPrograms.length} programs for merchant ${merchantAddress || "all"}`)

      // Check for duplicates and log warning
      const programIds = new Set()
      const duplicates = []

      filteredPrograms.forEach((program) => {
        if (programIds.has(program.id)) {
          duplicates.push(program.id)
        } else {
          programIds.add(program.id)
        }
      })

      if (duplicates.length > 0) {
        console.warn(`Found duplicate program IDs: ${duplicates.join(", ")}`)
      }

      // Remove duplicates before setting state
      const uniquePrograms = filteredPrograms.filter(
        (program, index, self) => index === self.findIndex((p) => p.id === program.id),
      )

      setPrograms(uniquePrograms)
    } catch (err) {
      console.error("Error fetching programs:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch programs"))
    } finally {
      setIsLoading(false)
    }
  }, [merchantAddress])

  const refresh = useCallback(() => {
    console.log("Manually refreshing programs...")
    fetchPrograms()
  }, [fetchPrograms])

  useEffect(() => {
    fetchPrograms()

    if (autoRefresh) {
      const intervalId = setInterval(fetchPrograms, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [fetchPrograms, autoRefresh, refreshInterval])

  // Listen for program updates from server actions
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "last_modified_program" || e.key === "last_created_program" || e.key === "program_action") {
        console.log("Program update detected, refreshing programs")
        fetchPrograms()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events
    const handleProgramsUpdated = () => {
      console.log("programsUpdated event detected, refreshing programs")
      fetchPrograms()
    }

    window.addEventListener("programsUpdated", handleProgramsUpdated)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
    }
  }, [fetchPrograms])

  return { programs, isLoading, error, refresh }
}