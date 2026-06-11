'use server'

import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { addPunch, getPunchCard } from '@/lib/services/punchcard-service'
import {
  validatePunchCard,
} from '@/lib/validation/punchcard-validator'
import { validateProgramForPunch } from '@/lib/validation/program-validator'
import { validateBalance, validateOperationCapacity } from '@/lib/validation/wallet-validator'
import { getAddressBalance } from '@/lib/services/bsv-service'
import { validateBlockchainStateBeforePunch } from '@/lib/validation/blockchain-state-validator'
import type { PunchCard } from '@/lib/types'
import type { Program } from '@/lib/types'

export interface PunchActionResult {
  success: boolean
  data?: PunchCard | null
  error?: string
  rateLimitInfo?: {
    remaining: number
    resetTime: number
    retryAfter: number
  }
}

/**
 * Server action to record a punch on a program
 * Includes:
 * - Server-side validation (address, program, punch card)
 * - Rate limiting to prevent spam (10 attempts per 5 minutes)
 * - Blockchain state verification
 */
export async function recordPunchAction(
  customerAddress: string,
  programId: string,
  program: Program
): Promise<PunchActionResult> {
  try {
    // STEP 1: Validate input data
    console.log('[v0] [PunchAction] Step 1: Validating input data')
    
    // Validate address format
    if (!customerAddress || customerAddress.length === 0) {
      return {
        success: false,
        error: 'Customer address is required',
      }
    }
    
    if (!programId || programId.length === 0) {
      return {
        success: false,
        error: 'Program ID is required',
      }
    }

    // STEP 2: Validate program exists
    console.log('[v0] [PunchAction] Step 2: Validating program exists')
    const programValidation = validateProgramForPunch(program)
    if (!programValidation.valid) {
      console.warn('[v0] [PunchAction] Program validation failed:', programValidation.errors)
      return {
        success: false,
        error: `Invalid program: ${programValidation.errors?.join('; ')}`,
      }
    }

    // STEP 3: Get and validate punch card
    console.log('[v0] [PunchAction] Step 3: Fetching and validating punch card')
    const card = getPunchCard(customerAddress, programId)
    if (!card) {
      console.warn('[v0] [PunchAction] Punch card not found for:', {
        customerAddress,
        programId,
      })
      return {
        success: false,
        error: 'Punch card not found for this program',
      }
    }

    // STEP 4: Validate wallet has sufficient balance
    // For punching, the cost is the satoshisPerPunch amount from the program
    console.log('[v0] [PunchAction] Step 4: Checking wallet balance')
    
    const punchCost = program.metadata?.satoshisPerPunch || 0
    
    try {
      const balanceData = await getAddressBalance(customerAddress)
      const walletBalance = balanceData.total
      
      const balanceValidation = validateOperationCapacity(walletBalance, punchCost)
      if (!balanceValidation.valid) {
        console.warn('[v0] [PunchAction] Wallet balance insufficient:', balanceValidation.errors)
        return {
          success: false,
          error: `Insufficient wallet balance for punch: ${balanceValidation.errors?.join('; ')}`,
        }
      }
      
      console.log('[v0] [PunchAction] Wallet balance check passed. Balance:', walletBalance, 'Punch cost:', punchCost)
    } catch (balanceError) {
      console.error('[v0] [PunchAction] Error checking wallet balance:', balanceError)
      return {
        success: false,
        error: 'Unable to verify wallet balance. Please try again.',
      }
    }

    // STEP 5: Verify blockchain state before punch
    console.log('[v0] [PunchAction] Step 5: Verifying blockchain state')
    const blockchainValidation = validateBlockchainStateBeforePunch(card, program)
    if (!blockchainValidation.valid) {
      console.warn('[v0] [PunchAction] Blockchain state validation failed:', blockchainValidation.errors)
      return {
        success: false,
        error: `Blockchain state invalid: ${blockchainValidation.errors?.join('; ')}`,
      }
    }

    // STEP 6: Proceed with punch recording
    console.log('[v0] [PunchAction] Step 6: Recording punch on blockchain')
    const clientId = await getClientId()
    const rateLimitKey = `punch:${clientId}:${programId}`
    const rateLimitConfig = RATE_LIMITS.HIGH

    const rateLimitResult = await rateLimiter(
      rateLimitKey,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.warn('[v0] [PunchAction] Rate limit exceeded for:', rateLimitKey)
      return {
        success: false,
        error: 'Too many punch attempts. Please wait before trying again.',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
      }
    }

    console.log('[v0] [PunchAction] Rate limit check passed. Remaining:', rateLimitResult.remaining)

    // STEP 8: Proceed with punch recording
    console.log('[v0] [PunchAction] Step 8: Recording punch on blockchain')
    const result = await addPunch(customerAddress, programId, program)

    if (!result) {
      console.warn('[v0] [PunchAction] addPunch returned null - punch card not found or invalid')
      return {
        success: false,
        error: 'Failed to record punch - punch card is no longer active',
      }
    }

    console.log('[v0] [PunchAction] Punch recorded successfully:', {
      transactionId: result.txId,
      punches: result.punches,
      status: result.status,
    })

    return {
      success: true,
      data: result,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: 0,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record punch'
    console.error('[v0] [PunchAction] Error recording punch:', error)

    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Server action to redeem a completed punch card
 * Only callable after required punches are met
 */
export async function redeemPunchCardAction(
  customerAddress: string,
  programId: string
): Promise<PunchActionResult> {
  try {
    console.log('[v0] [PunchAction] Redeeming punch card for', { customerAddress, programId })

    const clientId = await getClientId()
    const rateLimitKey = `redeem:${clientId}:${customerAddress}`
    const rateLimitConfig = RATE_LIMITS.MEDIUM

    const rateLimitResult = await rateLimiter(
      rateLimitKey,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.warn('[v0] [PunchAction] Rate limit exceeded for:', rateLimitKey)
      return {
        success: false,
        error: 'Too many redemption attempts. Please wait before trying again.',
      }
    }

    // Get the punch card
    const card = getPunchCard(customerAddress, programId)
    if (!card) {
      return {
        success: false,
        error: 'Punch card not found',
      }
    }

    // Verify the card is complete and eligible for redemption
    if (card.status !== 'active' || card.punches < card.program.requiredPunches) {
      return {
        success: false,
        error: 'Punch card is not ready for redemption',
      }
    }

    // Mark as redeemed in local state
    card.status = 'redeemed'
    card.redeemedAt = new Date().toISOString()

    console.log('[v0] [PunchAction] Punch card redeemed successfully:', {
      customerAddress,
      programId,
      txId: card.txId,
    })

    return {
      success: true,
      data: card,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to redeem punch card'
    console.error('[v0] [PunchAction] Error redeeming punch card:', error)

    return {
      success: false,
      error: message,
    }
  }
}