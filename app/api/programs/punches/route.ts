'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { recordPunchAction } from '@/app/actions/punch-actions'
import { getProgramMetadataById } from '@/lib/services/program-service'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * POST /api/programs/punches
 * 
 * Record a punch for a customer in a program (Phase 6 protocol)
 * Request body:
 * {
 *   customerAddress: string (BSV address of customer)
 *   programId: string
 * }
 * 
 * Returns: { success: boolean; data?: { txId: string; punches: number }; error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = await getClientId()
    
    // Rate limiting: HIGH tier (10 requests per 5 minutes for punch recording)
    const rateLimitResult = await rateLimiter(
      `record-punch:${clientId}`,
      RATE_LIMITS.HIGH.maxRequests,
      RATE_LIMITS.HIGH.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Punches] Rate limit exceeded for ${clientId}`)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many punch requests. Please wait before recording another punch.',
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

    console.log(`[v0] [API/Programs/Punches] Recording punch for customer ${customerAddress} in program ${programId}`)

    // Fetch program metadata
    const program = getProgramMetadataById(programId)
    if (!program) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Program not found',
        },
        { status: 404 }
      )
      return withCORSHeaders(response, request)
    }

    // Call server action to record punch
    const result = await recordPunchAction(customerAddress, programId, program)

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to record punch',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Punches] Punch recorded successfully: ${result.data?.txId}`)

    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    )
    return withCORSHeaders(response, request)
  } catch (error) {
    console.error('[v0] [API/Programs/Punches] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record punch',
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