'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { redeemPunchCardAction } from '@/app/actions/punch-actions'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * POST /api/programs/redeem
 * 
 * Redeem a completed punch card (Phase 6 protocol)
 * Request body:
 * {
 *   customerAddress: string (BSV address)
 *   programId: string
 * }
 * 
 * Returns: { success: boolean; data?: { txId: string; status: string }; error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = await getClientId()
    
    // Rate limiting: HIGH tier (10 requests per 5 minutes for redemptions)
    const rateLimitResult = await rateLimiter(
      `redeem-punch:${clientId}`,
      RATE_LIMITS.HIGH.maxRequests,
      RATE_LIMITS.HIGH.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Redeem] Rate limit exceeded for ${clientId}`)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many redemption requests. Please wait before redeeming again.',
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

    // Parse request body
    const body = await request.json()
    const { customerAddress, programId } = body

    // Validation: Required fields
    if (!customerAddress || !programId) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: customerAddress, programId',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    // Validation: BSV address format
    const addressValidation = validateBSVAddress(customerAddress)
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

    // Validation: Program ID format (basic)
    if (typeof programId !== 'string' || programId.length < 3) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid programId format' },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Redeem] Redeeming punch card for customer ${customerAddress} in program ${programId}`)

    // Call server action to redeem punch card
    const result = await redeemPunchCardAction(customerAddress, programId)

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to redeem punch card',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Redeem] Punch card redeemed successfully: ${result.data?.txId}`)

    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    )
    return withCORSHeaders(response, request)
  } catch (error) {
    console.error('[v0] [API/Programs/Redeem] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem punch card',
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