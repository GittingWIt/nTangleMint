/**
 * Storage Service
 * Abstracts localStorage access for all data persistence
 * Provides type-safe storage operations for programs, punch cards, and minterest
 */

import type { PunchCard } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/constants"

const isBrowser = typeof window !== "undefined"

// ============================================================================
// Generic Storage Helpers
// ============================================================================

/**
 * Get item from localStorage with type safety
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns Parsed value or default
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`[StorageService] Error reading ${key}:`, error)
    return defaultValue
  }
}

/**
 * Set item in localStorage with type safety
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser) {
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`[StorageService] Error writing ${key}:`, error)
    return false
  }
}

/**
 * Remove item from localStorage
 * @param key Storage key
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
  if (!isBrowser) {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`[StorageService] Error removing ${key}:`, error)
    return false
  }
}

/**
 * Clear all storage
 * @returns true if successful, false otherwise
 */
export function clearStorage(): boolean {
  if (!isBrowser) {
    return false
  }

  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error(`[StorageService] Error clearing storage:`, error)
    return false
  }
}

// ============================================================================
// Punch Card Storage Operations
// ============================================================================

export function getPunchCardsByCustomer(customerAddress: string): PunchCard[] {
  if (!isBrowser) return []
  
  try {
    const key = `${STORAGE_KEYS.PUNCH_CARDS}_${customerAddress}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("[Storage Service] Error getting punch cards:", error)
    return []
  }
}

/**
 * Get all punch cards from all customers (for analytics/counting)
 * Scans localStorage for all punch card keys
 */
export function getAllPunchCards(): PunchCard[] {
  if (!isBrowser) return []
  
  try {
    const allCards: PunchCard[] = []
    const prefix = STORAGE_KEYS.PUNCH_CARDS + "_"
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const cards = JSON.parse(data)
            if (Array.isArray(cards)) {
              allCards.push(...cards)
            }
          }
        } catch (error) {
          console.warn(`[Storage Service] Error parsing punch cards from ${key}:`, error)
        }
      }
    }
    
    return allCards
  } catch (error) {
    console.error("[Storage Service] Error getting all punch cards:", error)
    return []
  }
}

export function savePunchCard(punchCard: PunchCard): boolean {
  if (!isBrowser) return false

  try {
    const cards = getPunchCardsByCustomer(punchCard.customerAddress)
    // Use programId as the unique key per customer (one card per program per customer)
    const existingIndex = cards.findIndex(c => c.programId === punchCard.programId)

    if (existingIndex >= 0) {
      cards[existingIndex] = punchCard
    } else {
      cards.push(punchCard)
    }

    const key = `${STORAGE_KEYS.PUNCH_CARDS}_${punchCard.customerAddress}`
    localStorage.setItem(key, JSON.stringify(cards))

    return true
  } catch (error) {
    console.error("[Storage Service] Error saving punch card:", error)
    return false
  }
}

export function getPunchCardByProgramId(customerAddress: string, programId: string): PunchCard | null {
  const cards = getPunchCardsByCustomer(customerAddress)
  return cards.find(c => c.programId === programId) || null
}