'use client'

import { debug } from "./debug"
import type { PunchCard } from "./types"

/**
 * Phase 6 Punch Card Utility Module
 * 
 * Provides client-side utilities for punch card management.
 * All mutations (add punch, redeem) are handled via server actions to ensure blockchain consistency.
 * This module focuses on local state queries and UI helpers.
 */

/**
 * Get the current punch count for a customer in a program
 * Phase 6: Uses blockchain-native punch card model with customerAddress identity
 * 
 * @param punchCard The punch card from server state
 * @returns Current punch count
 */
export function getPunchCount(punchCard: PunchCard | null): number {
  if (!punchCard) return 0
  return punchCard.punches || 0
}

/**
 * Check if a punch card is eligible for redemption
 * Phase 6: A card is redeemable when status is 'active' AND punches >= requiredPunches
 * 
 * @param punchCard The punch card from server state
 * @returns Whether the card can be redeemed
 */
export function canRedeemReward(punchCard: PunchCard | null): boolean {
  if (!punchCard) return false
  
  // Card must be active (not already redeemed or expired)
  if (punchCard.status !== 'active') return false
  
  // Card must have enough punches
  const requiredPunches = punchCard.program?.requiredPunches || 0
  return punchCard.punches >= requiredPunches
}

/**
 * Calculate progress towards reward
 * Phase 6: Returns percentage of punches needed for redemption
 * 
 * @param punchCard The punch card from server state
 * @returns Progress percentage (0-100)
 */
export function getRedemptionProgress(punchCard: PunchCard | null): number {
  if (!punchCard) return 0
  
  const requiredPunches = punchCard.program?.requiredPunches || 1
  const currentPunches = punchCard.punches || 0
  
  return Math.min(100, Math.round((currentPunches / requiredPunches) * 100))
}

/**
 * Get remaining punches needed for redemption
 * Phase 6: Returns how many more punches are needed
 * 
 * @param punchCard The punch card from server state
 * @returns Punches remaining (0 if already eligible)
 */
export function getRemainingPunches(punchCard: PunchCard | null): number {
  if (!punchCard) return 0
  
  const requiredPunches = punchCard.program?.requiredPunches || 0
  const currentPunches = punchCard.punches || 0
  
  return Math.max(0, requiredPunches - currentPunches)
}

/**
 * Format punch card status for display
 * Phase 6: Maps blockchain status to user-friendly labels
 * 
 * @param status The punch card status ("active" | "redeemed" | "expired")
 * @returns User-friendly status label
 */
export function formatStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'Earning Punches'
    case 'redeemed':
      return 'Completed'
    case 'expired':
      return 'Expired'
    default:
      return 'Unknown'
  }
}

/**
 * Check if a punch card is still valid
 * Phase 6: A card is valid if it's active (not expired or already redeemed)
 * 
 * @param punchCard The punch card from server state
 * @returns Whether the card is still valid
 */
export function isCardValid(punchCard: PunchCard | null): boolean {
  if (!punchCard) return false
  return punchCard.status === 'active'
}

/**
 * Emit punch card event for component updates
 * Phase 6: Dispatches custom events for UI synchronization without page reload
 * 
 * @param eventType The event type ("punchAdded" | "rewardRedeemed" | "cardCreated")
 * @param detail Event detail data
 */
export function emitPunchCardEvent(
  eventType: 'punchAdded' | 'rewardRedeemed' | 'cardCreated',
  detail: Record<string, unknown>
): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(eventType, {
          detail,
        })
      )
      debug(`Emitted punch card event: ${eventType}`, detail)
    }
  } catch (error) {
    console.error('[v0] Error emitting punch card event:', error)
  }
}

/**
 * Listen for punch card events
 * Phase 6: Attach listeners for real-time UI updates
 * 
 * @param eventType The event type to listen for
 * @param callback Function to call when event fires
 * @returns Cleanup function to remove listener
 */
export function onPunchCardEvent(
  eventType: 'punchAdded' | 'rewardRedeemed' | 'cardCreated',
  callback: (detail: Record<string, unknown>) => void
): () => void {
  const handler = (e: Event) => {
    if (e instanceof CustomEvent) {
      callback(e.detail)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener(eventType, handler)
    
    // Return cleanup function
    return () => {
      window.removeEventListener(eventType, handler)
    }
  }

  return () => {} // No-op cleanup for SSR
}