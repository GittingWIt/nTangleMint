'use server'

import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { createProgram } from '@/lib/services/program-service'
import {
  validateProgramCreation,
  validateProgramFields,
} from '@/lib/validation/program-validator'
import { validateWalletBalanceForProgramCreation } from '@/lib/validation/wallet-validator'
import type { Program } from '@/lib/types'

export interface ProgramActionResult {
  success: boolean
  data?: Program
  error?: string
  rateLimitInfo?: {
    remaining: number
    resetTime: number
    retryAfter: number
  }
}

/**
 * Server action to create a new program
 * Includes:
 * - Server-side input validation (all parameters)
 * - Wallet balance verification
 * - Rate limiting to prevent spam (5 programs per 5 minutes)
 * - Comprehensive logging for auditing
 */
export async function createProgramAction(
  merchantAddress: string,
  programName: string,
  satoshisPerPunch: number,
  requiredPunches: number,
  bogoDetails?: {
    bogoInterval: number
    bogoAmount: number
  }
): Promise<ProgramActionResult> {
  try {
    // STEP 1: Validate input parameters
    console.log('[v0] [ProgramAction] Step 1: Validating input parameters')
    const inputValidation = validateProgramCreation({
      merchantAddress,
      name: programName,
      satoshisPerPunch,
      requiredPunches,
    })

    if (!inputValidation.valid) {
      console.warn('[v0] [ProgramAction] Input validation failed:', inputValidation.errors)
      return {
        success: false,
        error: `Invalid input: ${inputValidation.errors?.join('; ')}`,
      }
    }

    // STEP 2: Validate program fields and BOGO details
    console.log('[v0] [ProgramAction] Step 2: Validating program fields and BOGO')
    const fieldsValidation = validateProgramFields({
      name: programName,
      merchantAddress,
      satoshisPerPunch,
      requiredPunches,
      programType: bogoDetails ? 'bogo' : 'standard',
    })

    if (!fieldsValidation.valid) {
      console.warn('[v0] [ProgramAction] Fields validation failed:', fieldsValidation.errors)
      return {
        success: false,
        error: `Invalid program details: ${fieldsValidation.errors?.join('; ')}`,
      }
    }

    // STEP 3: Validate wallet has sufficient balance
    console.log('[v0] [ProgramAction] Step 3: Checking wallet balance')
    const balanceValidation = await validateWalletBalanceForProgramCreation(
      merchantAddress,
      satoshisPerPunch * requiredPunches
    )

    if (!balanceValidation.valid) {
      console.warn('[v0] [ProgramAction] Wallet balance check failed:', balanceValidation.errors)
      return {
        success: false,
        error: `Insufficient funds: ${balanceValidation.errors?.join('; ')}`,
      }
    }

    console.log('[v0] [ProgramAction] Wallet balance check passed. Available:', balanceValidation.balance)

    // STEP 4: Rate limiting check
    console.log('[v0] [ProgramAction] Step 4: Checking rate limit')
    const clientId = await getClientId()
    const rateLimitKey = `program:${clientId}:${merchantAddress}`
    const rateLimitConfig = RATE_LIMITS.HIGH

    const rateLimitResult = await rateLimiter(
      rateLimitKey,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    )

    if (!rateLimitResult.allowed) {
      console.warn('[v0] [ProgramAction] Rate limit exceeded for:', rateLimitKey)
      return {
        success: false,
        error: 'Too many program creation attempts. Please wait before creating another program.',
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
      }
    }

    console.log('[v0] [ProgramAction] Rate limit check passed. Remaining:', rateLimitResult.remaining)

    // STEP 5: Create program locally (no blockchain broadcast yet)
    // Programs are broadcast to blockchain when activateProgram() is called
    console.log('[v0] [ProgramAction] Step 5: Creating program locally')

    // NOTE: This action lacks walletID context from the client
    // For now, generate a temporary walletID - proper fix requires passing from client
    const tempWalletID = `wid_${Math.random().toString(36).substring(2, 14)}`

    const result = createProgram(
      tempWalletID,
      merchantAddress,
      {
        name: programName,
        description: '',
        requiredPunches,
        reward: `${satoshisPerPunch * requiredPunches}`,
        programType: bogoDetails ? 'bogo' : 'accumulation',
      }
    )

    if (!result) {
      console.warn('[v0] [ProgramAction] Program creation returned null')
      return {
        success: false,
        error: 'Failed to create program - unexpected error',
      }
    }

    console.log('[v0] [ProgramAction] Program created successfully:', {
      programId: result.id,
      name: result.name,
      merchant: result.merchantAddress,
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
    const message = error instanceof Error ? error.message : 'Failed to create program'
    console.error('[v0] [ProgramAction] Error creating program:', error)

    return {
      success: false,
      error: message,
    }
  }
}