"use client"

import { useState, useEffect } from "react"

/**
 * A hook that safely executes a function that uses browser APIs
 * @param apiFn The function that uses browser APIs
 * @param deps Dependencies array for the effect
 * @returns [result, error, isLoading]
 */
export function useBrowserApi<T>(apiFn: () => Promise<T> | T, deps: any[] = []): [T | null, Error | null, boolean] {
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const executeApi = async () => {
      try {
        const res = await apiFn()
        if (isMounted) {
          setResult(res)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error in useBrowserApi:", err)
          setError(err instanceof Error ? err : new Error(String(err)))
          setResult(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    executeApi()

    return () => {
      isMounted = false
    }
  }, deps)

  return [result, error, isLoading]
}