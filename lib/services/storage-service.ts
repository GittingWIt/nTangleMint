/**
 * Storage Service
 * Abstracts localStorage access for all data persistence
 * Provides type-safe storage operations for programs and punch cards
 * 
 * All storage keys are keyed off publicAddress (wallet's blockchain identity)
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
// Punch Card Storage Operations (keyed by publicAddress)
// ============================================================================

/**
 * Get all punch cards for a wallet participant.
 * Storage key: {PUNCH_CARDS}_{publicAddress}
 * 
 * @param publicAddress - Wallet's public address (blockchain identity)
 */
export function getPunchCardsByParticipant(publicAddress: string): PunchCard[] {
  if (!isBrowser) return []
  
  try {
    const key = `${STORAGE_KEYS.PUNCH_CARDS}_${publicAddress}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("[Storage Service] Error getting punch cards:", error)
    return []
  }
}

/**
 * Get all punch cards from all participants (for analytics/counting)
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

/**
 * Save or update a punch card
 * @param punchCard - Punch card to save (must have publicAddress set)
 * @param publicAddress - Participant's public address
 * @returns true if successful
 */
export function savePunchCard(punchCard: PunchCard, publicAddress: string): boolean {
  if (!isBrowser) return false

  try {
    const cards = getPunchCardsByParticipant(publicAddress)
    // Use programId as the unique key per wallet (one card per program per wallet)
    const existingIndex = cards.findIndex(c => c.programId === punchCard.programId)

    if (existingIndex >= 0) {
      cards[existingIndex] = punchCard
    } else {
      cards.push(punchCard)
    }

    const key = `${STORAGE_KEYS.PUNCH_CARDS}_${publicAddress}`
    localStorage.setItem(key, JSON.stringify(cards))

    return true
  } catch (error) {
    console.error("[Storage Service] Error saving punch card:", error)
    return false
  }
}

/**
 * Get a specific punch card by program ID
 * @param publicAddress - Participant's public address
 * @param programId - Program ID to find
 * @returns Punch card or null if not found
 */
export function getPunchCardByProgramId(publicAddress: string, programId: string): PunchCard | null {
  const cards = getPunchCardsByParticipant(publicAddress)
  return cards.find(c => c.programId === programId) || null
}

/**
 * Delete a punch card
 * @param publicAddress - Participant's public address
 * @param programId - Program ID to delete
 * @returns true if successful
 */
export function deletePunchCard(publicAddress: string, programId: string): boolean {
  if (!isBrowser) return false

  try {
    const cards = getPunchCardsByParticipant(publicAddress)
    const filtered = cards.filter(c => c.programId !== programId)
    
    if (filtered.length === cards.length) {
      return false // Card not found
    }

    const key = `${STORAGE_KEYS.PUNCH_CARDS}_${publicAddress}`
    if (filtered.length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(filtered))
    }

    return true
  } catch (error) {
    console.error("[Storage Service] Error deleting punch card:", error)
    return false
  }
}