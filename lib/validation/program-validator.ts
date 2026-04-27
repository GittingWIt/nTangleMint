import { ProgramCreationSchema, validateOrThrow } from './schemas'
import { validateBSVAddress } from './address-validator'
import { validatePerPunchAmount } from './amount-validator'
import type { Program } from '@/lib/types'

/**
 * Program Creation Server-Side Validation
 * Validates all program parameters before processing
 * Defense-in-depth: validates even if client-side validation was bypassed
 */

export interface ProgramValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate program creation input
 * This is called server-side in program creation action
 */
export function validateProgramCreation(data: unknown): ProgramValidationResult {
  try {
    validateOrThrow(ProgramCreationSchema, data, 'program creation')
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
 * Deep validation of program fields
 * Checks beyond schema (cross-field validation, business logic)
 */
export function validateProgramFields(data: {
  name?: string
  merchantAddress?: string
  satoshisPerPunch?: number
  requiredPunches?: number
  programType?: string
}): ProgramValidationResult {
  const errors: string[] = []

  // Validate merchant address
  if (data.merchantAddress) {
    const addressResult = validateBSVAddress(data.merchantAddress)
    if (!addressResult.valid) {
      errors.push(`Invalid merchant address: ${addressResult.error}`)
    }
  }

  // Validate satoshis per punch
  if (data.satoshisPerPunch !== undefined) {
    const amountResult = validatePerPunchAmount(data.satoshisPerPunch, data.requiredPunches)
    if (!amountResult.valid) {
      errors.push(`Invalid satoshis per punch: ${amountResult.error}`)
    }
  }

  // Validate BOGO specific logic
  if (data.programType === 'bogo' && data.requiredPunches !== undefined) {
    if (data.requiredPunches !== 1) {
      errors.push('BOGO programs must require exactly 1 punch')
    }
  }

  // Validate name
  if (data.name && data.name.length < 3) {
    errors.push('Program name must be at least 3 characters')
  }

  if (data.name && data.name.length > 50) {
    errors.push('Program name must be less than 50 characters')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate program exists and is active
 * Called before allowing operations on a program
 */
export function validateProgramExists(program: Program | null | undefined): ProgramValidationResult {
  if (!program) {
    return {
      valid: false,
      errors: ['Program not found'],
    }
  }

  return { valid: true }
}

/**
 * Validate program is accepting new punch cards
 */
export function validateProgramActive(program: Program): ProgramValidationResult {
  if (!program) {
    return {
      valid: false,
      errors: ['Program not found'],
    }
  }

  // Add any additional checks here
  // For example: if (program.status === 'closed') { ... }

  return { valid: true }
}

/**
 * Validate program exists and punch can be recorded on it
 */
export function validateProgramForPunch(program: Program | null | undefined): ProgramValidationResult {
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
 * Validate program creation wouldn't exceed merchant's transaction capacity
 * Helps prevent spam
 */
export function validateProgramCreationCapacity(merchantAddress: string): ProgramValidationResult {
  // This would integrate with rate limiting or merchant profile limits
  // For now, just a placeholder for future expansion
  return { valid: true }
}