'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { getActivePunchCards } from '@/lib/services/punchcard-service'
import { getProgramMetadataById } from '@/lib/services/program-service'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * GET /api/programs/participant?address=...
 * 
 * Get all programs a customer is participating in (has punch cards for)
 * Query parameters:
 *   address: BSV address of the customer (required)
 * 
 * Returns: { success: boolean; programs?: Program[]; count?: number; error?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = await getClientId()
    
    // Rate limiting: MEDIUM tier (100 requests per minute for read operations)
    const rateLimitResult = await rateLimiter(
      `participant-programs:${clientId}`,
      RATE_LIMITS.MEDIUM.maxRequests,
      RATE_LIMITS.MEDIUM.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Participant] Rate limit exceeded for ${clientId}`)
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
          error: `Invalid customer address: ${addressValidation.errors?.join('; ')}`,
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Participant] Fetching participant programs for customer ${address}`)

    // Get all punch cards for this customer
    const punchCards = getActivePunchCards(address)
    
    // Extract unique program IDs and fetch their metadata
    const programIds = [...new Set(punchCards.map(card => card.programId))]
    const programs = programIds
      .map(programId => getProgramMetadataById(programId))
      .filter(program => program !== null)

    console.log(`[v0] [API/Programs/Participant] Found ${programs.length} programs for customer ${address}`)

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
    console.error('[v0] [API/Programs/Participant] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch participant programs',
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