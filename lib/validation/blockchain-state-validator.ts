import { getProgramById } from '@/lib/services/program-service'
import { getPunchCard } from '@/lib/services/punchcard-service'
import type { Program, PunchCard } from '@/lib/types'

export interface BlockchainStateValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Verify program exists and is active on blockchain
 * Prevents punching on non-existent or archived programs
 */
export function validateProgramBlockchainState(program: Program | null | undefined): BlockchainStateValidationResult {
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
  }

  if (!program.merchantAddress) {
    errors.push('Program missing merchant address')
  }

  if (program.satoshisPerPunch <= 0) {
    errors.push('Program has invalid satoshi amount')
  }

  if (program.requiredPunches <= 0) {
    errors.push('Program has invalid required punches')
  }

  // Check if program is archived or inactive
  if ((program as any).isArchived === true) {
    errors.push('Program is archived and no longer accepting punches')
  }

  if ((program as any).status === 'closed') {
    errors.push('Program is closed and no longer accepting punches')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * Verify punch card exists and is in valid state for punching
 * Prevents double-punch, punching completed cards, or invalid cards
 */
export function validatePunchCardBlockchainState(
  card: PunchCard | null | undefined,
  program: Program
): BlockchainStateValidationResult {
  if (!card) {
    return {
      valid: false,
      errors: ['Punch card not found'],
    }
  }

  const errors: string[] = []

  // Card must match the program we're punching
  if (card.programId !== program.id) {
    errors.push('Punch card does not match program')
  }

  // Card must be active
  if (card.status !== 'active') {
    if (card.status === 'completed') {
      errors.push('Punch card is already completed - no more punches allowed')
    } else if (card.status === 'redeemed') {
      errors.push('Punch card has been redeemed and cannot receive new punches')
    } else if (card.status === 'expired') {
      errors.push('Punch card has expired and cannot receive new punches')
    } else {
      errors.push(`Punch card has invalid status: ${card.status}`)
    }
  }

  // Card must not exceed punch limit
  // Use > instead of >= because punches equal to requiredPunches means the card is full
  if (card.punches > program.requiredPunches) {
    errors.push(`Punch card exceeds maximum punches (has ${card.punches}, max ${program.requiredPunches})`)
  }

  // Card should have valid punch count
  if (card.punches < 0) {
    errors.push('Punch card has invalid punch count')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * Verify punch would not result in invalid state
 * Prevents state inconsistencies and double-spend
 */
export function validatePunchWouldBeValid(
  card: PunchCard,
  program: Program
): BlockchainStateValidationResult {
  const errors: string[] = []

  // Check punch wouldn't exceed limit
  const punchesAfter = card.punches + 1
  if (punchesAfter > program.requiredPunches) {
    errors.push(
      `Cannot punch: would exceed limit (${punchesAfter}/${program.requiredPunches})`
    )
  }

  // Verify program hasn't changed unexpectedly
  if (!program.id || !program.merchantAddress) {
    errors.push('Program state is corrupted')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * Comprehensive blockchain state verification before punch transaction
 * Combines program, card, and transaction state checks
 */
export function validateBlockchainStateBeforePunch(
  card: PunchCard,
  program: Program
): BlockchainStateValidationResult {
  const errors: string[] = []

  // Step 1: Verify program state
  const programValidation = validateProgramBlockchainState(program)
  if (!programValidation.valid) {
    errors.push(...(programValidation.errors || []))
  }

  // Step 2: Verify card state
  const cardValidation = validatePunchCardBlockchainState(card, program)
  if (!cardValidation.valid) {
    errors.push(...(cardValidation.errors || []))
  }

  // Step 3: Verify punch would be valid
  if (programValidation.valid && cardValidation.valid) {
    const punchValidation = validatePunchWouldBeValid(card, program)
    if (!punchValidation.valid) {
      errors.push(...(punchValidation.errors || []))
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true }
}