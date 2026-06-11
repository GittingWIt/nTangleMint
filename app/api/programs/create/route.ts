'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { createProgramAction } from '@/app/actions/program-actions'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * POST /api/programs/create
 * 
 * Create a new loyalty program on the blockchain (Phase 6 protocol)
 * Request body:
 * {
 *   creatorAddress: string (BSV address)
 *   programName: string
 *   satoshisPerPunch: number
 *   requiredPunches: number
 *   bogoDetails?: { bogoInterval: number; bogoAmount: number }
 * }
 * 
 * Returns: { success: boolean; data?: Program; error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = await getClientId()
    
    // Rate limiting: HIGH tier (10 requests per 5 minutes for program creation)
    const rateLimitResult = await rateLimiter(
      `create-program:${clientId}`,
      RATE_LIMITS.HIGH.maxRequests,
      RATE_LIMITS.HIGH.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Create] Rate limit exceeded for ${clientId}`)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many program creation requests. Please wait before creating another program.',
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
    const { creatorAddress, programName, satoshisPerPunch, requiredPunches, bogoDetails } = body

    // Validation: Required fields
    if (!creatorAddress || !programName || satoshisPerPunch === undefined || requiredPunches === undefined) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: creatorAddress, programName, satoshisPerPunch, requiredPunches',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    // Validation: BSV address format
    const addressValidation = validateBSVAddress(creatorAddress)
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

    // Validation: Numeric fields
    if (typeof satoshisPerPunch !== 'number' || satoshisPerPunch <= 0) {
      const response = NextResponse.json(
        { success: false, error: 'satoshisPerPunch must be a positive number' },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    if (typeof requiredPunches !== 'number' || requiredPunches <= 0) {
      const response = NextResponse.json(
        { success: false, error: 'requiredPunches must be a positive number' },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    // Validation: Program name length
    if (programName.length < 3 || programName.length > 100) {
      const response = NextResponse.json(
        { success: false, error: 'Program name must be between 3 and 100 characters' },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Create] Creating program: ${programName} for creator ${creatorAddress}`)

    // Call server action to create program
    const result = await createProgramAction(
      creatorAddress,
      programName,
      satoshisPerPunch,
      requiredPunches,
      bogoDetails
    )

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create program',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Create] Program created successfully: ${result.data?.id}`)

    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 }
    )
    return withCORSHeaders(response, request)
  } catch (error) {
    console.error('[v0] [API/Programs/Create] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create program',
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