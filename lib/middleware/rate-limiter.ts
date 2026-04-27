import { Redis } from "@upstash/redis";

// Initialize Redis client using environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be allowed based on rate limit
 * Uses sliding window algorithm stored in Redis
 *
 * @param identifier - Unique identifier (user ID or IP address)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with allow/deny decision
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const key = `rate-limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get all requests in current window from Redis
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart); // Remove old requests
    pipeline.zcard(key); // Count requests in window
    pipeline.zrange(key, 0, -1); // Get all request timestamps
    pipeline.expire(key, Math.ceil(windowMs / 1000)); // Set expiry

    const results = await pipeline.exec();
    const requestCount = (results[1] as number) || 0;

    const resetTime =
      ((results[2] as number[])?.length || 0) > 0
        ? (results[2] as number[])[0] + windowMs
        : now + windowMs;

    const allowed = requestCount < maxRequests;

    if (allowed) {
      // Add current request to Redis
      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      // Set expiry on key
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    const result: RateLimitResult = {
      allowed,
      limit: maxRequests,
      current: requestCount + (allowed ? 1 : 0),
      remaining: Math.max(0, maxRequests - (requestCount + (allowed ? 1 : 0))),
      resetTime,
      retryAfter: !allowed ? Math.ceil((resetTime - now) / 1000) : undefined,
    };

    if (!allowed) {
      console.log(
        "[v0] Rate limit exceeded:",
        identifier,
        "current:",
        requestCount,
        "limit:",
        maxRequests
      );
    }

    return result;
  } catch (error) {
    console.error("[v0] Rate limit check error:", error);
    // On Redis error, allow request to prevent service outage
    return {
      allowed: true,
      limit: maxRequests,
      current: 0,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    };
  }
}

/**
 * Rate limiter function - wrapper around checkRateLimit for easier use
 * This is the main export used throughout the application
 */
export const rateLimiter = checkRateLimit;