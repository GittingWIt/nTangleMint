/**
 * Cache Service
 *
 * Provides in-memory caching with TTL (Time-To-Live) support for blockchain queries.
 * Reduces WhatsOnChain API load and improves response times for repeated queries.
 *
 * Cache Strategy by Data Type:
 * - Balance queries: 30 seconds (changes frequently)
 * - Confirmed transactions: 24 hours (immutable)
 * - Pending state: 5 minutes (being indexed by WhatsOnChain)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

interface CacheStats {
  totalQueries: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  entriesStored: number
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    entriesStored: 0,
  }

  /**
   * Get cached data if it exists and hasn't expired
   * @param key - Cache key
   * @returns Cached data or null if missing/expired
   */
  get<T>(key: string): T | null {
    this.stats.totalQueries++
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.cacheMisses++
      this.updateHitRate()
      console.log(`[v0] [Cache] MISS: ${key}`)
      return null
    }

    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      // Expired - remove and treat as miss
      this.cache.delete(key)
      this.stats.cacheMisses++
      this.updateHitRate()
      console.log(`[v0] [Cache] EXPIRED: ${key} (age: ${Math.round(age / 1000)}s, ttl: ${Math.round(entry.ttl / 1000)}s)`)
      return null
    }

    // Cache hit
    this.stats.cacheHits++
    this.updateHitRate()
    console.log(`[v0] [Cache] HIT: ${key} (age: ${Math.round(age / 1000)}s)`)
    return entry.data as T
  }

  /**
   * Store data in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time-to-live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
    this.stats.entriesStored = this.cache.size
    console.log(`[v0] [Cache] SET: ${key} (ttl: ${Math.round(ttlMs / 1000)}s, entries: ${this.cache.size})`)
  }

  /**
   * Clear specific cache entries by key pattern
   * @param pattern - Key pattern to match (simple substring match)
   */
  clearByPattern(pattern: string): number {
    let cleared = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        cleared++
      }
    }
    this.stats.entriesStored = this.cache.size
    if (cleared > 0) {
      console.log(`[v0] [Cache] INVALIDATED: pattern "${pattern}" (cleared ${cleared} entries)`)
    }
    return cleared
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    const count = this.cache.size
    this.cache.clear()
    this.stats.entriesStored = 0
    console.log(`[v0] [Cache] CLEARED ALL: ${count} entries removed`)
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      entriesStored: 0,
    }
  }

  /**
   * Update hit rate percentage
   */
  private updateHitRate(): void {
    if (this.stats.totalQueries === 0) {
      this.stats.hitRate = 0
    } else {
      this.stats.hitRate = (this.stats.cacheHits / this.stats.totalQueries) * 100
    }
  }
}

// Singleton instance
const cacheService = new CacheService()

// ============================================================================
// Cache Key Builders
// ============================================================================

/**
 * Build cache key for wallet metadata queries
 */
export function getCacheKeyWallet(address: string): string {
  return `wallet:${address}`
}

/**
 * Build cache key for program metadata queries
 */
export function getCacheKeyProgram(programId: string): string {
  return `program:${programId}`
}

/**
 * Build cache key for punch card queries
 */
export function getCacheKeyPunchCard(
  programId: string,
  customerAddress: string
): string {
  return `punchcard:${programId}:${customerAddress}`
}

/**
 * Build cache key for balance queries
 */
export function getCacheKeyBalance(address: string): string {
  return `balance:${address}`
}

// ============================================================================
// TTL Constants (milliseconds)
// ============================================================================

export const CACHE_TTL = {
  /** Balance changes frequently - refresh every 30 seconds */
  BALANCE: 30 * 1000,

  /** Confirmed transactions are immutable - cache for 24 hours */
  CONFIRMED: 24 * 60 * 60 * 1000,

  /** Pending state being indexed - check every 5 minutes */
  PENDING: 5 * 60 * 1000,

  /** Wallet metadata is immutable - cache for 24 hours */
  WALLET: 24 * 60 * 60 * 1000,

  /** Program data rarely changes - cache for 1 hour */
  PROGRAM: 60 * 60 * 1000,
}

// ============================================================================
// Export Public API
// ============================================================================

export default cacheService