/**
 * React hooks for working with storage
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { unifiedStorage } from "@/lib/unified-storage"

/**
 * Hook for using storage values in components
 */
export function useStorageValue<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // State to track if the value has been loaded from storage
  const [loaded, setLoaded] = useState(false)

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const value = unifiedStorage.getItem<T>(key)
      setStoredValue(value !== null ? value : initialValue)
    } catch (error) {
      console.error(`Error reading from storage for key "${key}":`, error)
      setStoredValue(initialValue)
    } finally {
      setLoaded(true)
    }
  }, [key, initialValue])

  // Return a wrapped version of useState's setter function that
  // persists the new value to storage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save state
        setStoredValue(valueToStore)

        // Save to storage
        unifiedStorage.setItem(key, valueToStore)
      } catch (error) {
        console.error(`Error saving to storage for key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue, loaded]
}

/**
 * Hook for using storage values with expiration
 */
export function useStorageValueWithExpiry<T>(
  key: string,
  initialValue: T,
  expiryMs: number,
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // State to track if the value has been loaded from storage
  const [loaded, setLoaded] = useState(false)

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const value = unifiedStorage.getItem<T>(key)
      setStoredValue(value !== null ? value : initialValue)
    } catch (error) {
      console.error(`Error reading from storage for key "${key}":`, error)
      setStoredValue(initialValue)
    } finally {
      setLoaded(true)
    }
  }, [key, initialValue])

  // Return a wrapped version of useState's setter function that
  // persists the new value to storage with expiry
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save state
        setStoredValue(valueToStore)

        // Save to storage with expiry
        unifiedStorage.setItem(key, valueToStore, expiryMs)
      } catch (error) {
        console.error(`Error saving to storage for key "${key}":`, error)
      }
    },
    [key, storedValue, expiryMs],
  )

  return [storedValue, setValue, loaded]
}