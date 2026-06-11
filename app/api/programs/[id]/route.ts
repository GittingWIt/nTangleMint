'use server'

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { deleteProgramAction } from '@/app/actions/program-actions'
import { validateBSVAddress } from '@/lib/validation/wallet-validator'
import { handleCORSPreflight, withCORSHeaders } from '@/lib/middleware/cors'

/**
 * DELETE /api/programs/[id]
 * 
 * Delete a program (only allowed by creator, Phase 6 protocol)
 * Query parameters:
 *   creatorAddress: string (BSV address of the creator)
 * 
 * Returns: { success: boolean; data?: { programId: string }; error?: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params
    const clientId = await getClientId()
    
    // Rate limiting: HIGH tier (10 requests per 5 minutes for deletions)
    const rateLimitResult = await rateLimiter(
      `delete-program:${clientId}`,
      RATE_LIMITS.HIGH.maxRequests,
      RATE_LIMITS.HIGH.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.log(`[v0] [API/Programs/Delete] Rate limit exceeded for ${clientId}`)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many deletion requests. Please wait before deleting another program.',
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

    // Validation: Program ID
    if (!programId || programId.length < 3) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid program ID',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creatorAddress')

    // Validation: Required creator address parameter
    if (!creatorAddress) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: creatorAddress',
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

    console.log(`[v0] [API/Programs/Delete] Deleting program ${programId} by creator ${creatorAddress}`)

    // Call server action to delete program
    const result = await deleteProgramAction(programId, creatorAddress)

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to delete program',
        },
        { status: 400 }
      )
      return withCORSHeaders(response, request)
    }

    console.log(`[v0] [API/Programs/Delete] Program deleted successfully: ${programId}`)

    const response = NextResponse.json(
      {
        success: true,
        data: { programId },
      },
      { status: 200 }
    )
    return withCORSHeaders(response, request)
  } catch (error) {
    console.error('[v0] [API/Programs/Delete] Error:', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete program',
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