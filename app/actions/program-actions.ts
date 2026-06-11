'use server'

import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { createProgram, getProgramMetadataById } from '@/lib/services/program-service'
import { getActivePunchCards } from '@/lib/services/punchcard-service'
import {
  validateProgramCreation,
} from '@/lib/validation/program-validator'
import { validateBalance, validateOperationCapacity } from '@/lib/validation/wallet-validator'
import { getAddressBalance } from '@/lib/services/bsv-service'
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
  creatorAddress: string,
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
      creatorAddress,
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

    // STEP 2: Validate wallet has sufficient balance for program creation
    console.log('[v0] [ProgramAction] Step 2: Checking wallet balance')
    const registrationFee = satoshisPerPunch * requiredPunches
    
    try {
      const balanceData = await getAddressBalance(creatorAddress)
      const walletBalance = balanceData.total
      
      const capacityValidation = validateOperationCapacity(walletBalance, registrationFee)
      
      if (!capacityValidation.valid) {
        console.warn('[v0] [ProgramAction] Wallet balance check failed:', capacityValidation.errors)
        return {
          success: false,
          error: `Insufficient funds for program creation: ${capacityValidation.errors?.join('; ')}`,
        }
      }
      
      console.log('[v0] [ProgramAction] Wallet balance check passed. Balance:', walletBalance, 'Fee:', registrationFee)
    } catch (balanceError) {
      console.error('[v0] [ProgramAction] Error checking wallet balance:', balanceError)
      return {
        success: false,
        error: 'Unable to verify wallet balance. Please try again.',
      }
    }

    // STEP 3: Rate limiting check
    console.log('[v0] [ProgramAction] Step 3: Checking rate limit')
    const clientId = await getClientId()
    const rateLimitKey = `program:${clientId}:${creatorAddress}`
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

    // STEP 4: Create program locally (no blockchain broadcast yet)
    // Programs are broadcast to blockchain when broadcastProgramCreation() is called via activation
    console.log('[v0] [ProgramAction] Step 4: Creating program locally')

    // Build reward description - include BOGO info if applicable
    const rewardDescription = bogoDetails
      ? `BOGO: Buy ${bogoDetails.bogoAmount} get ${bogoDetails.bogoInterval} free`
      : `Reward after ${requiredPunches} punches`

    const program = createProgram(
      creatorAddress,
      {
        name: programName,
        description: '', // Description can be set later during edit
        requiredPunches,
        reward: rewardDescription,
        satoshisPerPunch,
      }
    )

    if (!program) {
      console.warn('[v0] [ProgramAction] Program creation returned null')
      return {
        success: false,
        error: 'Failed to create program - unexpected error',
      }
    }

    console.log('[v0] [ProgramAction] Program created successfully:', {
      programId: program.id,
      name: program.name,
      creator: program.creatorAddress,
    })

    return {
      success: true,
      data: program,
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

/**
 * Server action to delete a program
 * Only allowed by the creator (blockchain-native identity via publicAddress)
 */
export async function deleteProgramAction(
  programId: string,
  creatorAddress: string
): Promise<ProgramActionResult> {
  try {
    console.log('[v0] [ProgramAction] Attempting to delete program:', {
      programId,
      creatorAddress,
    })

    // Validate inputs
    if (!programId || !creatorAddress) {
      return {
        success: false,
        error: 'Program ID and creator address are required',
      }
    }

    // Get the program to verify ownership
    const program = getProgramMetadataById(programId)
    if (!program) {
      return {
        success: false,
        error: 'Program not found',
      }
    }

    // Verify the caller is the creator
    if (program.creatorAddress !== creatorAddress) {
      console.warn('[v0] [ProgramAction] Unauthorized delete attempt:', {
        programId,
        attemptedBy: creatorAddress,
        actualCreator: program.creatorAddress,
      })
      return {
        success: false,
        error: 'Only the program creator can delete this program',
      }
    }

    // Check if program has active punch cards - cannot delete if customers are using it
    const activePunches = getActivePunchCards(creatorAddress)
    const hasActivePunches = activePunches.some(card => card.programId === programId)
    
    if (hasActivePunches) {
      return {
        success: false,
        error: 'Cannot delete program with active customer punch cards',
      }
    }

    // Mark program as deleted in local state
    program.status = 'deleted'
    program.deletedAt = new Date().toISOString()

    console.log('[v0] [ProgramAction] Program deleted successfully:', {
      programId,
      creator: creatorAddress,
    })

    return {
      success: true,
      data: program,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete program'
    console.error('[v0] [ProgramAction] Error deleting program:', error)

    return {
      success: false,
      error: message,
    }
  }
}