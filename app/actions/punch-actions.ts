'use server'

import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { addPunch, getPunchCard } from '@/lib/services/punchcard-service'
import {
  validatePunchRecording,
  validatePunchComplete,
} from '@/lib/validation/punch-validator'
import { validateProgramForPunch } from '@/lib/validation/program-validator'
import { validateWalletBalanceForPunch } from '@/lib/validation/wallet-validator'
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
    const inputValidation = validatePunchRecording({ customerAddress, programId })
    if (!inputValidation.valid) {
      console.warn('[v0] [PunchAction] Input validation failed:', inputValidation.errors)
      return {
        success: false,
        error: `Invalid input: ${inputValidation.errors?.join('; ')}`,
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
    console.log('[v0] [PunchAction] Step 4: Checking wallet balance')
    const walletValidation = await validateWalletBalanceForPunch(customerAddress, program)
    if (!walletValidation.valid) {
      console.warn('[v0] [PunchAction] Wallet validation failed:', walletValidation.errors)
      return {
        success: false,
        error: `Wallet check failed: ${walletValidation.errors?.join('; ')}`,
      }
    }
    console.log('[v0] [PunchAction] Wallet balance check passed. Available:', walletValidation.balance)

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

    // STEP 6: Complete validation (cross-field)
    console.log('[v0] [PunchAction] Step 6: Running complete punch validation')
    const completeValidation = validatePunchComplete({
      card,
      program,
      customerAddress,
      merchantAddress: program.merchantAddress,
    })
    if (!completeValidation.valid) {
      console.warn('[v0] [PunchAction] Complete validation failed:', completeValidation.errors)
      return {
        success: false,
        error: `Validation failed: ${completeValidation.errors?.join('; ')}`,
      }
    }

    // STEP 7: Rate limiting check
    console.log('[v0] [PunchAction] Step 7: Checking rate limit')
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
      cardId: result.id,
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
 * Server action to create a program (merchant-side)
 * Includes rate limiting to prevent spam program creation
 * 
 * Rate limit: 5 programs per 5 minutes per merchant
 */
export async function createProgramAction(programData: any): Promise<PunchActionResult> {
  try {
    const clientId = getClientId()
    const rateLimitKey = `program:create:${clientId}`
    const rateLimitConfig = RATE_LIMITS.HIGH
    
    console.log('[v0] [CreateProgramAction] Checking rate limit for:', rateLimitKey)
    
    const rateLimitResult = await rateLimiter(
      rateLimitKey,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    )
    
    if (!rateLimitResult.allowed) {
      console.warn('[v0] [CreateProgramAction] Rate limit exceeded')
      
      return {
        success: false,
        error: 'Too many program creation attempts. Please wait before trying again.',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
      }
    }
    
    console.log('[v0] [CreateProgramAction] Rate limit check passed')
    
    // TODO: Implement actual program creation logic
    // This is a placeholder for the future program creation endpoint
    
    return {
      success: false,
      error: 'Program creation not yet implemented in server action',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create program'
    console.error('[v0] [CreateProgramAction] Error creating program:', error)
    
    return {
      success: false,
      error: message,
    }
  }
}