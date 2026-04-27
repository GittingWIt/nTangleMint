/**
 * IP Throttling for Edge Middleware
 * 
 * Simple in-memory rate limiting by IP address.
 * Note: This resets on cold starts in serverless. For persistent rate limiting,
 * consider Upstash Redis integration.
 * 
 * Current limits:
 * - API endpoints: 100 requests per minute per IP
 * - Strict endpoints (wallet operations): 20 requests per minute per IP
 */

// In-memory store for request counts
// Map<IP, { count: number, resetTime: number }>
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

// Configuration
const RATE_LIMITS = {
  // General API endpoints
  default: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Strict limits for sensitive endpoints
  strict: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
}

// Strict rate limit paths (wallet operations, auth)
const STRICT_PATHS = [
  "/api/wallet",
  "/api/auth",
  "/api/bsv",
]

/**
 * Get client IP from request
 * Checks x-forwarded-for header (set by Vercel) first
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, first is the client
    return forwarded.split(",")[0].trim()
  }
  
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP.trim()
  }
  
  // Fallback - shouldn't happen on Vercel
  return "unknown"
}

/**
 * Check if request should be rate limited
 * Returns { limited: boolean, remaining: number, resetIn: number }
 */
export function checkIPThrottle(
  ip: string,
  path: string
): { limited: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  
  // Determine which rate limit to apply
  const isStrictPath = STRICT_PATHS.some(p => path.startsWith(p))
  const limit = isStrictPath ? RATE_LIMITS.strict : RATE_LIMITS.default
  
  // Create unique key for IP + limit type
  const key = `${ip}:${isStrictPath ? "strict" : "default"}`
  
  // Get or create entry
  let entry = ipRequestCounts.get(key)
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs,
    }
  }
  
  // Increment count
  entry.count++
  ipRequestCounts.set(key, entry)
  
  // Calculate remaining and reset time
  const remaining = Math.max(0, limit.maxRequests - entry.count)
  const resetIn = Math.max(0, Math.ceil((entry.resetTime - now) / 1000))
  
  // Check if limited
  const limited = entry.count > limit.maxRequests
  
  return { limited, remaining, resetIn }
}

/**
 * Clean up expired entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of ipRequestCounts.entries()) {
    if (now > entry.resetTime) {
      ipRequestCounts.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}