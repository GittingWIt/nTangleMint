/**
 * Block Height Service
 * Fetches and caches the current BSV block height via API proxy route
 */
import { network } from "@/lib/config/network"

let cachedBlockHeight = 0
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minute cache

/**
 * Get current block height from our external API route (public endpoint, avoids CORS)
 */
export async function fetchBlockHeight(): Promise<number> {
  // Skip fetching during build time (relative URLs don't work in server context)
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return 0
  }
  
  try {
    // Use the public external route handler (bypasses CORS, no auth required)
    const response = await fetch('/api/external/block-height')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch block height: ${response.statusText}`)
    }
    
    const data = await response.json()
    cachedBlockHeight = data.blockHeight || 0
    lastFetchTime = Date.now()
    
    return cachedBlockHeight
  } catch (error) {
    console.error("[Block Height Service] Error fetching block height:", error)
    // Return cached value if available, otherwise 0
    return cachedBlockHeight
  }
}

/**
 * Get cached block height (fetches if cache is stale)
 */
export async function getCachedBlockHeight(): Promise<number> {
  const now = Date.now()
  
  // Return cached value if still fresh
  if (cachedBlockHeight > 0 && now - lastFetchTime < CACHE_DURATION) {
    return cachedBlockHeight
  }
  
  // Fetch fresh value
  return fetchBlockHeight()
}

/**
 * Get the cached block height synchronously (may be stale or 0)
 */
export function getBlockHeightSync(): number {
  return cachedBlockHeight
}

/**
 * Calculate expiration block height based on days from now
 * BSV averages ~144 blocks per day (1 block every 10 minutes)
 */
export function calculateExpirationBlockHeight(currentBlockHeight: number, days: number): number {
  const blocksPerDay = 144
  return currentBlockHeight + days * blocksPerDay
}

/**
 * Estimate days until a target block height
 */
export function estimateDaysUntilBlock(currentBlockHeight: number, targetBlockHeight: number): number {
  if (targetBlockHeight <= currentBlockHeight) return 0
  
  const blocksPerDay = 144
  const blocksRemaining = targetBlockHeight - currentBlockHeight
  return Math.ceil(blocksRemaining / blocksPerDay)
}

/**
 * Format block height for display
 */
export function formatBlockHeight(height: number): string {
  return height.toLocaleString()
}

/**
 * Refresh/fetch the latest block height immediately
 */
export async function refreshBlockHeight(): Promise<number> {
  return fetchBlockHeight()
}