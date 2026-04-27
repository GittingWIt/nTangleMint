/**
 * Cache Statistics Endpoint
 * 
 * Provides debugging and monitoring information about the cache service.
 * Usage: GET /api/internal/cache-stats
 */

import cacheService from "@/lib/services/cache-service"

export async function GET() {
  const stats = cacheService.getStats()

  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cache: stats,
  })
}