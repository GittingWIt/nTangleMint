'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { getCreatorPrograms } from '@/lib/services/program-service'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * GET /api/programs/creator?address=...
 * 
 * Get all programs created by a specific address (Phase 6 creator identity)
 * Query parameters:
 *   address: BSV address of the creator (required)
 * 
 * Returns: { success: boolean; programs?: Program[]; count?: number; error?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = await getClientId()
    
    // Rate limiting: MEDIUM tier (100 requests per minute for read operations)
    const rateLimitResult = await rateLimiter(
      `creator-programs:${clientId}`,
      RATE_LIMITS.MEDIUM.maxRequests,
      RATE_LIMITS.MEDIUM.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Creator] Rate limit exceeded for ${clientId}`)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': (rateLimitResult.retryAfter ?? 0).toString(),
          },
        }
      )
      return withCORSHeaders(response, request)
    }

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    // Validation: Required address parameter
    if (!address) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: address',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    // Validation: BSV address format
    const addressValidation = validateBSVAddress(address)
    if (!addressValidation.valid) {
      const response = NextResponse.json(
        {
          success: false,
          error: `Invalid creator address: ${addressValidation.errors?.join('; ')}`,
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Creator] Fetching programs for creator ${address}`)

    // Fetch programs created by this address
    const programs = await getCreatorPrograms(address)

    console.log(`[v0] [API/Programs/Creator] Found ${programs.length} programs for creator ${address}`)

    const response = NextResponse.json(
      {
        success: true,
        programs,
        count: programs.length,
      },
      { status: 200 }
    )
    return withCORSHeaders(response, request)
  } catch (error) {
    console.error('[v0] [API/Programs/Creator] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch creator programs',
      },
      { status: 500 }
    )
    return withCORSHeaders(response, request)
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCORSPreflight(request)
}