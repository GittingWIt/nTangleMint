import { getAddressBalance } from '@/lib/services/bsv-service'
import { validateBSVAddress } from './address-validator'
import { validatePerPunchAmount } from './amount-validator'
import type { Program } from '@/lib/types'

export interface WalletValidationResult {
  valid: boolean
  errors?: string[]
  balance?: number
  required?: number
  fee?: number
}

const TRANSACTION_FEE = 500 // satoshis - approximate fee for standard transaction
const PROGRAM_CREATION_FEE = 1000 // higher fee for program creation transaction

/**
 * Validate wallet has sufficient balance for a punch transaction
 * Checks: address validity, balance >= (punch amount + fee), minimum amount
 */
export async function validateWalletBalanceForPunch(
  address: string,
  program: Program
): Promise<WalletValidationResult> {
  const errors: string[] = []

  // Step 1: Validate address format
  const addressValidation = validateBSVAddress(address)
  if (!addressValidation.valid) {
    return {
      valid: false,
      errors: [`Invalid wallet address: ${addressValidation.error}`],
    }
  }

  // Step 2: Validate punch amount is valid
  const punchAmountValidation = validatePerPunchAmount(
    program.satoshisPerPunch,
    program.requiredPunches
  )
  if (!punchAmountValidation.valid) {
    errors.push(`Invalid punch amount: ${punchAmountValidation.error}`)
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  try {
    // Step 3: Get current wallet balance
    const balanceData = await getAddressBalance(address)

    if (balanceData === null) {
      return {
        valid: false,
        errors: ['Unable to fetch wallet balance. Please try again.'],
        balance: 0,
      }
    }

    // Extract total balance (confirmed + unconfirmed)
    const balance = balanceData.total

    // Step 4: Calculate required amount (punch + fee)
    const required = program.satoshisPerPunch + TRANSACTION_FEE

    // Step 5: Check balance is sufficient
    if (balance < required) {
      return {
        valid: false,
        errors: [
          `Insufficient balance. Required: ${required} satoshis, Available: ${balance} satoshis`,
        ],
        balance: balance,
        required: required,
        fee: TRANSACTION_FEE,
      }
    }

    return {
      valid: true,
      balance: balance,
      required: required,
      fee: TRANSACTION_FEE,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching balance'
    return {
      valid: false,
      errors: [`Failed to validate wallet balance: ${message}`],
    }
  }
}

/**
 * Validate wallet has sufficient balance for program creation
 * Programs require more satoshis to be locked in the blockchain
 */
export async function validateWalletBalanceForProgramCreation(
  address: string,
  initialFunding: number
): Promise<WalletValidationResult> {
  const errors: string[] = []

  // Step 1: Validate address
  const addressValidation = validateBSVAddress(address)
  if (!addressValidation.valid) {
    return {
      valid: false,
      errors: [`Invalid wallet address: ${addressValidation.error}`],
    }
  }

  // Step 2: Validate initial funding amount
  const fundingValidation = validatePerPunchAmount(initialFunding, 1)
  if (!fundingValidation.valid) {
    errors.push(`Invalid funding amount: ${fundingValidation.error}`)
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  try {
    const balanceData = await getAddressBalance(address)

    if (balanceData === null) {
      return {
        valid: false,
        errors: ['Unable to fetch wallet balance. Please try again.'],
        balance: 0,
      }
    }

    // Extract total balance (confirmed + unconfirmed)
    const balance = balanceData.total

    // Program creation requires more - initial funding + higher fee
    const required = initialFunding + PROGRAM_CREATION_FEE

    if (balance < required) {
      return {
        valid: false,
        errors: [
          `Insufficient balance for program creation. Required: ${required} satoshis, Available: ${balance} satoshis`,
        ],
        balance: balance,
        required: required,
        fee: PROGRAM_CREATION_FEE,
      }
    }

    return {
      valid: true,
      balance: balance,
      required: required,
      fee: PROGRAM_CREATION_FEE,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching balance'
    return {
      valid: false,
      errors: [`Failed to validate wallet balance: ${message}`],
    }
  }
}

/**
 * Validate wallet exists and is accessible
 */
export async function validateWalletAccessibility(
  address: string
): Promise<WalletValidationResult> {
  const addressValidation = validateBSVAddress(address)
  if (!addressValidation.valid) {
    return {
      valid: false,
      errors: [`Invalid wallet address: ${addressValidation.error}`],
    }
  }

  try {
    const balanceData = await getAddressBalance(address)

    if (balanceData === null) {
      return {
        valid: false,
        errors: ['Unable to access wallet. Please check your address and try again.'],
      }
    }

    return {
      valid: true,
      balance: balanceData.total,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      errors: [`Failed to access wallet: ${message}`],
    }
  }
}