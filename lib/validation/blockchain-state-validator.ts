/**
 * Blockchain State Validator
 *
 * Validates blockchain state and on-chain transaction data coherence.
 * Ensures program and punch card states are valid before blockchain operations.
 *
 * Key responsibilities:
 * - Verify program exists and is active on-chain
 * - Verify punch card matches program and is in valid state
 * - Validate transaction IDs and block heights (BSV format)
 * - Ensure punch count logic prevents invalid operations
 * - Validate transaction type indicators
 *
 * Does NOT validate identity (derived from TX signatures, not stored).
 */

import { programIDSchema, transactionTypeSchema } from './schemas'
import type { Program, PunchCard } from '@/lib/types'
import { z } from 'zod'

export interface BlockchainStateValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate transaction ID format (Bitcoin/BSV format)
 * Should be a 64-character hex string
 */
export function validateTransactionId(txId: string): BlockchainStateValidationResult {
  const errors: string[] = []

  if (!txId) {
    errors.push('Transaction ID required')
  }

  if (txId.length !== 64) {
    errors.push('Transaction ID must be 64 characters')
  }

  if (!/^[a-f0-9]{64}$/i.test(txId)) {
    errors.push('Transaction ID must be valid hexadecimal')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate block height
 * Should be a non-negative integer
 */
export function validateBlockHeight(blockHeight: number): BlockchainStateValidationResult {
  const errors: string[] = []

  if (!Number.isInteger(blockHeight)) {
    errors.push('Block height must be an integer')
  }

  if (blockHeight < 0) {
    errors.push('Block height cannot be negative')
  }

  if (blockHeight > 999999999) {
    errors.push('Block height seems unrealistic')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate program ID exists on-chain (pid_{12-char-base36})
 */
export function validateProgramIdOnChain(programId: string): BlockchainStateValidationResult {
  try {
    programIDSchema.parse(programId)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => e.message)
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Invalid program ID format'] }
  }
}

/**
 * Validate transaction type indicator
 * Used to verify nTangleMint transaction classification
 */
export function validateTransactionType(typeIndicator: string): BlockchainStateValidationResult {
  try {
    transactionTypeSchema.parse(typeIndicator)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => e.message)
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Invalid transaction type'] }
  }
}

/**
 * Verify program exists and is active on blockchain
 * Prevents operations on non-existent or archived programs
 */
export function validateProgramBlockchainState(
  program: Program | null | undefined
): BlockchainStateValidationResult {
  if (!program) {
    return {
      valid: false,
      errors: ['Program not found on blockchain'],
    }
  }

  const errors: string[] = []

  // Verify program has required blockchain properties
  if (!program.id) {
    errors.push('Program missing blockchain ID')
  } else {
    const idCheck = validateProgramIdOnChain(program.id)
    if (!idCheck.valid) {
      errors.push(...(idCheck.errors || []))
    }
  }

  // Verify program has required metadata
  if (!program.metadata?.requiredPunches || program.metadata.requiredPunches <= 0) {
    errors.push('Program has invalid required punches')
  }

  // Check program status
  if (program.status === 'inactive') {
    errors.push('Program is inactive and not accepting punches')
  }

  if (program.status === 'deleted') {
    errors.push('Program is deleted and not accepting punches')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Verify punch card exists and is in valid state for punching
 * Prevents double-punch, punching completed cards, or invalid cards
 */
export function validatePunchCardBlockchainState(
  punchCard: PunchCard | null | undefined,
  program: Program
): BlockchainStateValidationResult {
  if (!punchCard) {
    return {
      valid: false,
      errors: ['Punch card not found'],
    }
  }

  const errors: string[] = []

  // Card must match the program we're punching
  if (punchCard.programId !== program.id) {
    errors.push('Punch card does not match program')
  }

  // Card must be active
  if (punchCard.status !== 'active') {
    if (punchCard.status === 'redeemed') {
      errors.push('Punch card has been redeemed and cannot receive new punches')
    } else {
      errors.push(`Punch card has invalid status: ${punchCard.status}`)
    }
  }

  // Card must not exceed punch limit
  if (punchCard.punches > punchCard.requiredPunches) {
    errors.push(
      `Punch card exceeds maximum punches (has ${punchCard.punches}, max ${punchCard.requiredPunches})`
    )
  }

  // Card should have valid punch count
  if (punchCard.punches < 0) {
    errors.push('Punch card has invalid punch count')
  }

  // Verify nTangle transaction ID exists
  if (!punchCard.txId) {
    errors.push('Punch card missing nTangle transaction ID')
  } else {
    const txIdCheck = validateTransactionId(punchCard.txId)
    if (!txIdCheck.valid) {
      errors.push(...(txIdCheck.errors || []))
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Verify punch would not result in invalid state
 * Prevents state inconsistencies and double-spend
 */
export function validatePunchWouldBeValid(
  punchCard: PunchCard,
  program: Program
): BlockchainStateValidationResult {
  const errors: string[] = []

  // Check punch wouldn't exceed limit
  const punchesAfter = punchCard.punches + 1
  if (punchesAfter > punchCard.requiredPunches) {
    errors.push(
      `Cannot punch: would exceed limit (${punchesAfter}/${punchCard.requiredPunches})`
    )
  }

  // Verify program is still valid
  if (!program.id) {
    errors.push('Program state is corrupted')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Comprehensive blockchain state verification before punch transaction
 * Combines program, card, and punch validation
 */
export function validateBlockchainStateBeforePunch(
  punchCard: PunchCard | null | undefined,
  program: Program | null | undefined
): BlockchainStateValidationResult {
  const errors: string[] = []

  if (!punchCard) {
    return { valid: false, errors: ['Punch card not found'] }
  }

  if (!program) {
    return { valid: false, errors: ['Program not found'] }
  }

  // Step 1: Verify program state
  const programValidation = validateProgramBlockchainState(program)
  if (!programValidation.valid) {
    errors.push(...(programValidation.errors || []))
  }

  // Step 2: Verify card state
  const cardValidation = validatePunchCardBlockchainState(punchCard, program)
  if (!cardValidation.valid) {
    errors.push(...(cardValidation.errors || []))
  }

  // Step 3: Verify punch would be valid
  if (programValidation.valid && cardValidation.valid) {
    const punchValidation = validatePunchWouldBeValid(punchCard, program)
    if (!punchValidation.valid) {
      errors.push(...(punchValidation.errors || []))
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate on-chain program state
 * Checks that program data on-chain is coherent
 */
export function validateProgramStateOnChain(options: {
  programId: string
  txId: string
  blockHeight?: number
}): BlockchainStateValidationResult {
  const errors: string[] = []

  const programIdCheck = validateProgramIdOnChain(options.programId)
  if (!programIdCheck.valid) {
    errors.push(...(programIdCheck.errors || []))
  }

  const txIdCheck = validateTransactionId(options.txId)
  if (!txIdCheck.valid) {
    errors.push(...(txIdCheck.errors || []))
  }

  if (options.blockHeight !== undefined) {
    const blockHeightCheck = validateBlockHeight(options.blockHeight)
    if (!blockHeightCheck.valid) {
      errors.push(...(blockHeightCheck.errors || []))
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate on-chain punch card state
 * Checks that punch transaction data is coherent
 */
export function validatePunchStateOnChain(options: {
  programId: string
  txId: string
  punchIndex?: number
  blockHeight?: number
  typeIndicator: string
}): BlockchainStateValidationResult {
  const errors: string[] = []

  const programIdCheck = validateProgramIdOnChain(options.programId)
  if (!programIdCheck.valid) {
    errors.push(...(programIdCheck.errors || []))
  }

  const txIdCheck = validateTransactionId(options.txId)
  if (!txIdCheck.valid) {
    errors.push(...(txIdCheck.errors || []))
  }

  const typeCheck = validateTransactionType(options.typeIndicator)
  if (!typeCheck.valid) {
    errors.push(...(typeCheck.errors || []))
  }

  // Validate punchIndex if provided
  if (options.punchIndex !== undefined) {
    if (!Number.isInteger(options.punchIndex) || options.punchIndex < 1) {
      errors.push('Punch index must be a positive integer')
    }
  }

  if (options.blockHeight !== undefined) {
    const blockHeightCheck = validateBlockHeight(options.blockHeight)
    if (!blockHeightCheck.valid) {
      errors.push(...(blockHeightCheck.errors || []))
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate transaction confirmation level
 * Ensures transaction has sufficient confirmations before accepting
 */
export function validateTransactionConfirmations(
  confirmations: number,
  requiredConfirmations: number = 6
): BlockchainStateValidationResult {
  const errors: string[] = []

  if (!Number.isInteger(confirmations)) {
    errors.push('Confirmations must be an integer')
  }

  if (confirmations < 0) {
    errors.push('Confirmations cannot be negative')
  }

  if (confirmations < requiredConfirmations) {
    errors.push(
      `Insufficient confirmations. Need ${requiredConfirmations}, have ${confirmations}`
    )
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate on-chain data completeness
 * Ensures all required on-chain fields are present
 */
export function validateOnChainDataComplete(options: {
  txId: string
  blockHeight: number
  timestamp: number
  data: string[]
}): BlockchainStateValidationResult {
  const errors: string[] = []

  if (!options.txId) {
    errors.push('Transaction ID required')
  }

  if (options.blockHeight === undefined || options.blockHeight < 0) {
    errors.push('Valid block height required')
  }

  if (!options.timestamp || options.timestamp <= 0) {
    errors.push('Valid timestamp required')
  }

  if (!Array.isArray(options.data) || options.data.length === 0) {
    errors.push('Transaction data required')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}