'use client'

import { useState, useCallback } from 'react'
import type { Program } from '@/lib/types'

export type DraftProgram = Omit<Program, 'id' | 'status'> & {
  id: string
  draftId: string // Unique identifier for draft
  creatorAddress: string // Wallet address that created this draft
  createdAt: number // Timestamp in ms
  expiresAt: number // Timestamp in ms (24 hours from creation)
  isDraft: true
}

const DRAFT_STORAGE_KEY = 'draft_programs'
const DRAFT_EXPIRATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Convert draft's numeric createdAt to ISO string for broadcast
 */
export function convertDraftTimestamp(createdAtMs: number): string {
  return new Date(createdAtMs).toISOString()
}

/**
 * Hook for managing draft programs in localStorage
 * Automatically handles expiration cleanup
 */
export function useDraftPrograms() {
  const [drafts, setDrafts] = useState<DraftProgram[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored) as DraftProgram[]
      
      // Filter out expired drafts
      const now = Date.now()
      const active = parsed.filter(d => d.expiresAt > now)
      
      // Update storage if any were removed
      if (active.length < parsed.length) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(active))
      }
      
      return active
    } catch (error) {
      console.error('[v0] Error loading draft programs:', error)
      return []
    }
  })

  /**
   * Add a new draft program
   */
  const addDraft = useCallback((programData: Omit<DraftProgram, 'draftId' | 'createdAt' | 'expiresAt' | 'isDraft'> & { creatorAddress: string }) => {
    try {
      const now = Date.now()
      const newDraft: DraftProgram = {
        ...programData,
        draftId: `draft_${now}_${Math.random().toString(36).substr(2, 9)}`,
        id: `draft_${now}_${Math.random().toString(36).substr(2, 9)}`,
        creatorAddress: programData.creatorAddress,
        createdAt: now,
        expiresAt: now + DRAFT_EXPIRATION_MS,
        isDraft: true
      }

      const updated = [...drafts, newDraft]
      setDrafts(updated)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated))
      
      return newDraft
    } catch (error) {
      console.error('[v0] Error adding draft program:', error)
      throw error
    }
  }, [drafts])

  /**
   * Get a specific draft by ID
   */
  const getDraft = useCallback((draftId: string): DraftProgram | null => {
    return drafts.find(d => d.draftId === draftId) || null
  }, [drafts])

  /**
   * Get all draft programs for a specific creator wallet
   */
  const getDraftsByCreator = useCallback((creatorAddress: string): DraftProgram[] => {
    return drafts.filter(d => d.creatorAddress === creatorAddress)
  }, [drafts])

  /**
   * Update an existing draft
   */
  const updateDraft = useCallback((draftId: string, updates: Partial<Omit<DraftProgram, 'draftId' | 'createdAt' | 'expiresAt' | 'isDraft'>>) => {
    try {
      const updated = drafts.map(d => 
        d.draftId === draftId ? { ...d, ...updates } : d
      )
      setDrafts(updated)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated))
      
      return updated.find(d => d.draftId === draftId) || null
    } catch (error) {
      console.error('[v0] Error updating draft program:', error)
      throw error
    }
  }, [drafts])

  /**
   * Delete a draft program
   */
  const deleteDraft = useCallback((draftId: string) => {
    try {
      const updated = drafts.filter(d => d.draftId !== draftId)
      setDrafts(updated)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('[v0] Error deleting draft program:', error)
      throw error
    }
  }, [drafts])

  /**
   * Clear all expired drafts manually
   */
  const clearExpired = useCallback(() => {
    try {
      const now = Date.now()
      const updated = drafts.filter(d => d.expiresAt > now)
      if (updated.length < drafts.length) {
        setDrafts(updated)
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated))
      }
      return drafts.length - updated.length
    } catch (error) {
      console.error('[v0] Error clearing expired drafts:', error)
      return 0
    }
  }, [drafts])

  return {
    drafts,
    addDraft,
    getDraft,
    getDraftsByCreator,
    updateDraft,
    deleteDraft,
    clearExpired
  }
}