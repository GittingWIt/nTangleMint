/**
 * Rate limit configuration for different endpoints and actions
 * Define limits by priority level
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  description: string;
}

/**
 * CRITICAL: Auth, wallet creation, transaction broadcasting
 * Most restrictive - prevents abuse of sensitive operations
 */
const CRITICAL_LIMITS: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
  description: "3 requests per 15 minutes",
};

/**
 * HIGH: Program creation, punch recording, form submissions
 * Strict but allows normal usage
 */
const HIGH_LIMITS: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
  description: "10 requests per 5 minutes",
};

/**
 * MEDIUM: API reads (fetch programs, wallet balance, punch cards)
 * Standard rate limit for normal API usage
 */
const MEDIUM_LIMITS: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  description: "100 requests per minute",
};

/**
 * LOW: Page views, UI interactions
 * Permissive limit for frontend interactions
 */
const LOW_LIMITS: RateLimitConfig = {
  maxRequests: 1000,
  windowMs: 60 * 1000, // 1 minute
  description: "1000 requests per minute",
};

/**
 * Unified RATE_LIMITS object for easy access
 */
export const RATE_LIMITS = {
  CRITICAL: CRITICAL_LIMITS,
  HIGH: HIGH_LIMITS,
  MEDIUM: MEDIUM_LIMITS,
  LOW: LOW_LIMITS,
};

/**
 * Endpoint-specific rate limit configurations
 */
export const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  // CRITICAL - Authentication & Wallet
  "/api/auth/login": RATE_LIMITS.CRITICAL,
  "/api/wallet/create": RATE_LIMITS.CRITICAL,
  "/api/wallet/import": RATE_LIMITS.CRITICAL,

  // CRITICAL - Transaction Broadcasting (highest priority)
  "/api/bsv": RATE_LIMITS.CRITICAL,

  // HIGH - Program & Punch Operations
  "/api/program/create": RATE_LIMITS.HIGH,
  "/api/program/join": RATE_LIMITS.HIGH,
  "/api/punch/record": RATE_LIMITS.HIGH,

  // MEDIUM - API Reads
  "/api/program/list": RATE_LIMITS.MEDIUM,
  "/api/wallet/balance": RATE_LIMITS.MEDIUM,
  "/api/punch/cards": RATE_LIMITS.MEDIUM,

  // DEFAULT
  default: RATE_LIMITS.LOW,
};

/**
 * Get rate limit config for an endpoint
 * Falls back to default if specific endpoint not configured
 */
export function getLimitConfig(endpoint: string): RateLimitConfig {
  return ENDPOINT_LIMITS[endpoint] || ENDPOINT_LIMITS.default;
}