"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseProgramsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  merchantAddress?: string
}

interface Program {
  id: string
  merchantAddress: string
  name: string
  // Add other program properties as needed
}

async function getPrograms(): Promise<Program[]> {
  // Replace with your actual program fetching logic
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockPrograms: Program[] = [
        { id: "1", merchantAddress: "merchant1", name: "Program A" },
        { id: "2", merchantAddress: "merchant2", name: "Program B" },
        { id: "3", merchantAddress: "merchant1", name: "Program C" },
      ]
      resolve(mockPrograms)
    }, 500)
  })
}

const STORAGE_KEYS = {
  PROGRAMS: "programs",
}

const STORAGE_EVENTS = {
  PROGRAM_CREATED: "program_created",
}

// Update the usePrograms hook to handle program updates better

export function usePrograms(options: UseProgramsOptions = {}) {
  const { autoRefresh = true, refreshInterval = 5000, merchantAddress } = options
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const fetchPrograms = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setIsLoading(true)
      const fetchedPrograms = await getPrograms()

      if (!mountedRef.current) return

      // Filter by merchant address if provided
      const filteredPrograms = merchantAddress
        ? fetchedPrograms.filter((p) => p.merchantAddress === merchantAddress)
        : fetchedPrograms

      setPrograms(filteredPrograms)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to fetch programs"))
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [merchantAddress])

  // Initial fetch and setup event listeners
  useEffect(() => {
    mountedRef.current = true

    const loadPrograms = async () => {
      if (!mountedRef.current) return

      try {
        setIsLoading(true)
        const data = localStorage.getItem("programs")
        const programs = data ? JSON.parse(data) : []

        if (merchantAddress) {
          setPrograms(programs.filter((p: any) => p.merchantAddress === merchantAddress))
        } else {
          setPrograms(programs)
        }

        setError(null)
      } catch (err) {
        console.error("Failed to load programs:", err)
        setError(err instanceof Error ? err.message : "Failed to load programs")
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadPrograms()

    // Listen for program updates
    const handleProgramsUpdated = () => loadPrograms()
    window.addEventListener("programsUpdated", handleProgramsUpdated)
    window.addEventListener("storage", (e) => {
      if (e.key === "programs") loadPrograms()
    })

    return () => {
      mountedRef.current = false
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
      window.removeEventListener("storage", (e) => {
        if (e.key === "programs") loadPrograms()
      })
    }
  }, [merchantAddress])

  return {
    programs,
    isLoading,
    error,
    refresh: fetchPrograms,
  }
}