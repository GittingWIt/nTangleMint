import { PunchRecordingSchema, validateOrThrow } from './schemas'
import { validateBSVAddress } from './address-validator'
import type { PunchCard, Program } from '@/lib/types'

/**
 * Punch Recording Server-Side Validation
 * Validates punch recording before broadcasting transaction
 * Prevents invalid, duplicate, or malicious punch attempts
 */

export interface PunchValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate punch recording input
 * Called server-side before recording a punch
 */
export function validatePunchRecording(data: unknown): PunchValidationResult {
  try {
    validateOrThrow(PunchRecordingSchema, data, 'punch recording')
    return { valid: true }
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        errors: [error.message],
      }
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    }
  }
}

/**
 * Validate customer address for punch
 */
export function validatePunchAddress(customerAddress: string): PunchValidationResult {
  const addressResult = validateBSVAddress(customerAddress)
  if (!addressResult.valid) {
    return {
      valid: false,
      errors: [addressResult.error || 'Invalid customer address'],
    }
  }

  return { valid: true }
}

/**
 * Validate punch card exists and is valid
 */
export function validatePunchCard(card: PunchCard | null | undefined): PunchValidationResult {
  if (!card) {
    return {
      valid: false,
      errors: ['Punch card not found'],
    }
  }

  return { valid: true }
}

/**
 * Validate punch card is active (can receive punches)
 */
export function validatePunchCardActive(card: PunchCard): PunchValidationResult {
  const errors: string[] = []

  if (card.status !== 'active') {
    errors.push(`Card is ${card.status}, cannot receive punch`)
  }

  if (card.punches >= card.requiredPunches) {
    errors.push('Card already has the required number of punches')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate program exists and punch can be recorded on it
 */
export function validateProgramForPunch(program: Program | null | undefined): PunchValidationResult {
  if (!program) {
    return {
      valid: false,
      errors: ['Program not found'],
    }
  }

  // Add more checks as needed
  // For example: if (program.isArchived) { ... }

  return { valid: true }
}

/**
 * Validate punch state (cross-field validation)
 * Ensures punch card and program are compatible
 */
export function validatePunchState(card: PunchCard, program: Program): PunchValidationResult {
  const errors: string[] = []

  // Verify card belongs to program
  if (card.programId !== program.id) {
    errors.push('Punch card does not belong to this program')
  }

  // Verify punch logic makes sense
  if (card.requiredPunches !== program.requiredPunches) {
    console.warn('[v0] Warning: Punch card required punches differs from program', {
      card: card.requiredPunches,
      program: program.requiredPunches,
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate merchant address for punch transaction
 * Ensures merchant address is valid before sending satoshis
 */
export function validateMerchantAddressForPunch(merchantAddress: string): PunchValidationResult {
  const addressResult = validateBSVAddress(merchantAddress)
  if (!addressResult.valid) {
    return {
      valid: false,
      errors: [addressResult.error || 'Invalid merchant address'],
    }
  }

  return { valid: true }
}

/**
 * Complete punch validation - runs all checks
 * Returns comprehensive result suitable for logging/auditing
 */
export function validatePunchComplete(options: {
  card: PunchCard | null | undefined
  program: Program | null | undefined
  customerAddress: string
  merchantAddress: string
}): PunchValidationResult {
  const errors: string[] = []

  // Run all validators
  const cardCheck = validatePunchCard(options.card)
  if (!cardCheck.valid) {
    errors.push(...(cardCheck.errors || []))
  }

  const programCheck = validateProgramForPunch(options.program)
  if (!programCheck.valid) {
    errors.push(...(programCheck.errors || []))
  }

  // Only check detailed state if both card and program exist
  if (options.card && options.program) {
    const stateCheck = validatePunchState(options.card, options.program)
    if (!stateCheck.valid) {
      errors.push(...(stateCheck.errors || []))
    }

    const activeCheck = validatePunchCardActive(options.card)
    if (!activeCheck.valid) {
      errors.push(...(activeCheck.errors || []))
    }
  }

  const customerAddressCheck = validatePunchAddress(options.customerAddress)
  if (!customerAddressCheck.valid) {
    errors.push(...(customerAddressCheck.errors || []))
  }

  const merchantAddressCheck = validateMerchantAddressForPunch(options.merchantAddress)
  if (!merchantAddressCheck.valid) {
    errors.push(...(merchantAddressCheck.errors || []))
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}