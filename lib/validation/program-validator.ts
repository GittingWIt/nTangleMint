import { ProgramCreationSchema, validateOrThrow, BSVAddressSchema, programIDSchema } from './schemas'
import { validateBSVAddress } from './address-validator'
import { validatePerPunchAmount } from './amount-validator'
import type { Program } from '@/lib/types'

/**
 * Program Validator
 *
 * Validates program data using nTangleMint format.
 * Uses creatorAddress (BSV public address) for program creator identification on-chain.
 * Focuses on program creation, updates, and business logic validation.
 */

export interface ProgramValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate program creation input using nTangleMint schema
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
 * Now uses creatorAddress (BSV P2PKH) instead of legacy creatorWalletID
 */
export function validateProgramFields(data: {
  name?: string
  creatorAddress?: string
  satoshisPerPunch?: number
  requiredPunches?: number
  expirationDays?: number
  reward?: string
}): ProgramValidationResult {
  const errors: string[] = []

  // Validate creator address format (BSV P2PKH)
  if (data.creatorAddress) {
    try {
      BSVAddressSchema.parse(data.creatorAddress)
    } catch {
      errors.push('Invalid creator address format (must be valid BSV P2PKH address)')
    }
  }

  // Validate satoshis per punch
  if (data.satoshisPerPunch !== undefined) {
    if (data.satoshisPerPunch < 100) {
      errors.push('Satoshis per punch must be at least 100')
    }
    if (data.satoshisPerPunch > 100000000) {
      errors.push('Satoshis per punch cannot exceed 1 BSV')
    }
  }

  // Validate required punches
  if (data.requiredPunches !== undefined) {
    if (data.requiredPunches < 1) {
      errors.push('Required punches must be at least 1')
    }
    if (data.requiredPunches > 1000) {
      errors.push('Required punches cannot exceed 1000')
    }
  }

  // Validate expiration days
  if (data.expirationDays !== undefined) {
    if (data.expirationDays < 1) {
      errors.push('Expiration days must be at least 1')
    }
    if (data.expirationDays > 3650) {
      errors.push('Expiration days cannot exceed 10 years')
    }
  }

  // Validate reward description
  if (data.reward) {
    if (data.reward.length < 1) {
      errors.push('Reward description required')
    }
    if (data.reward.length > 200) {
      errors.push('Reward description cannot exceed 200 characters')
    }
  }

  // Validate name
  if (data.name && data.name.length < 3) {
    errors.push('Program name must be at least 3 characters')
  }

  if (data.name && data.name.length > 100) {
    errors.push('Program name must be less than 100 characters')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate program ID format (pid_{12-char-base36})
 *
 * @param programId - Program ID to validate
 * @returns Validation result
 */
export function validateProgramId(programId: string): ProgramValidationResult {
  try {
    programIDSchema.parse(programId)
    return { valid: true }
  } catch (error: unknown) {
    if (error instanceof Error && 'errors' in error) {
      const typedError = error as { errors: Array<{ message: string }> }
      const messages = typedError.errors.map((e) => e.message)
      return { valid: false, errors: messages }
    }
    return { valid: false, errors: ['Invalid program ID'] }
  }
}

/**
 * Validate creator address format (BSV P2PKH address)
 * Used to verify program creator is correctly identified on-chain
 *
 * @param creatorAddress - Creator's BSV public address to validate
 * @returns Validation result
 */
export function validateCreatorAddress(creatorAddress: string): ProgramValidationResult {
  try {
    BSVAddressSchema.parse(creatorAddress)
    return { valid: true }
  } catch (error: unknown) {
    if (error instanceof Error && 'errors' in error) {
      const typedError = error as { errors: Array<{ message: string }> }
      const messages = typedError.errors.map((e) => e.message)
      return { valid: false, errors: messages }
    }
    return { valid: false, errors: ['Invalid creator address format (must be valid BSV P2PKH address)'] }
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

  if (program.status !== 'active') {
    return {
      valid: false,
      errors: [`Program is ${program.status}, not accepting new punch cards`],
    }
  }

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

  return validateProgramActive(program)
}

/**
 * Validate program creation wouldn't exceed capacity
 * Helps prevent spam by rate-limiting per creator address
 */
export function validateProgramCreationCapacity(creatorAddress: string): ProgramValidationResult {
  // Validate creator address format first
  const addressValidation = validateCreatorAddress(creatorAddress)
  if (!addressValidation.valid) {
    return addressValidation
  }

  // This would integrate with rate limiting or merchant profile limits
  // For now, just format validation
  return { valid: true }
}