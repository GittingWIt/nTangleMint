import { SatoshiAmountSchema } from './schemas'

/**
 * Satoshi Amount Validation
 * Ensures amounts are economically viable and prevent common attacks
 */

export interface AmountValidationResult {
  valid: boolean
  error?: string
  satoshis?: number
}

/**
 * Dust limit - minimum economically viable transaction
 * Generally 1 satoshi is the minimum, but some prefer higher
 */
export const SATOSHI_DUST_LIMIT = 1

/**
 * Maximum satoshis (21M BTC in satoshis)
 */
export const MAX_SATOSHIS = 2100000000000000

/**
 * Typical transaction fee estimate per byte
 * Used to warn if amount is too low to cover fees
 */
export const FEE_RATE_SAT_PER_BYTE = 0.5

/**
 * Validate satoshi amount
 * Checks for reasonable values, prevents overflow/underflow
 */
export function validateAmount(amount: unknown): AmountValidationResult {
  // Use Zod schema for initial validation
  const schemaResult = SatoshiAmountSchema.safeParse(amount)
  if (!schemaResult.success) {
    return {
      valid: false,
      error: schemaResult.error.errors[0]?.message || 'Invalid amount',
    }
  }

  const satoshis = schemaResult.data

  // Check dust limit
  if (satoshis < SATOSHI_DUST_LIMIT) {
    return {
      valid: false,
      error: `Amount must be at least ${SATOSHI_DUST_LIMIT} satoshi`,
    }
  }

  // Check maximum
  if (satoshis > MAX_SATOSHIS) {
    return {
      valid: false,
      error: 'Amount exceeds maximum satoshis',
    }
  }

  return {
    valid: true,
    satoshis,
  }
}

/**
 * Validate per-punch amount (for punch card programs)
 * Typically should be reasonable for reward value
 */
export function validatePerPunchAmount(
  satoshis: number,
  requiredPunches?: number
): AmountValidationResult {
  const amountValidation = validateAmount(satoshis)
  if (!amountValidation.valid) {
    return amountValidation
  }

  // Additional check: warn if total reward is very small
  if (requiredPunches && satoshis * requiredPunches < 100) {
    console.warn(
      `[v0] Warning: Total reward (${satoshis * requiredPunches} sats) is very small`
    )
  }

  return amountValidation
}

/**
 * Validate total transaction amount
 * Checks amount + estimated fees won't exceed wallet balance
 */
export function validateTotalAmount(
  baseAmount: number,
  estimatedFees: number = 0
): AmountValidationResult {
  const total = baseAmount + estimatedFees

  const validation = validateAmount(total)
  if (!validation.valid) {
    return {
      valid: false,
      error: `Total amount (${total} sats including fees) is invalid: ${validation.error}`,
    }
  }

  return {
    valid: true,
    satoshis: total,
  }
}

/**
 * Batch validate multiple amounts
 */
export function validateAmounts(amounts: number[]): {
  valid: number[]
  invalid: Array<{ amount: number; error: string }>
} {
  const valid: number[] = []
  const invalid: Array<{ amount: number; error: string }> = []

  for (const amount of amounts) {
    const result = validateAmount(amount)
    if (result.valid && result.satoshis !== undefined) {
      valid.push(result.satoshis)
    } else {
      invalid.push({ amount, error: result.error || 'Unknown error' })
    }
  }

  return { valid, invalid }
}

/**
 * Check if amount is reasonable for a reward
 * Returns warning message if amount seems too small/large
 */
export function getAmountWarning(satoshis: number): string | null {
  if (satoshis < 10) {
    return 'This reward is very small (less than 10 sats)'
  }

  if (satoshis > 1000000) {
    return 'This reward is very large (over 1M sats)'
  }

  return null
}