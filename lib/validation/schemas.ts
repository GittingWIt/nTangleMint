import { z } from 'zod'

/**
 * Central Zod schemas for nTangleMint validation
 * Source of truth for data validation across the application
 * Used by both client-side forms and server-side validators
 */

// ============================================
// ID SCHEMAS - nTangleMint Format
// ============================================

/**
 * Program ID format: pid_{12-char-base36}
 * Total 16 characters. Fixed format for on-chain recovery.
 */
export const programIDSchema = z
  .string()
  .regex(/^pid_[0-9a-z]{12}$/, 'Invalid program ID format (must be pid_[0-9a-z]{12})')

// ============================================
// ADDRESS SCHEMAS - BSV Blockchain
// ============================================

/**
 * BSV P2PKH Address format
 * Validates Bitcoin Standard Visibility addresses (legacy format).
 * Used for blockchain operations, balance checks, transaction signing.
 * This is the universal wallet identifier in nTangleMint.
 */
export const BSVAddressSchema = z
  .string()
  .min(26, 'Invalid address length')
  .max(35, 'Invalid address length')
  .regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, 'Invalid BSV address format')
  .describe('Valid BSV P2PKH address')

// ============================================
// AMOUNT SCHEMAS
// ============================================

export const SatoshiAmountSchema = z
  .number()
  .int('Amount must be a whole number')
  .min(1, 'Amount must be at least 1 satoshi')
  .max(2100000000000000, 'Amount exceeds maximum satoshis')
  .describe('Valid satoshi amount')

export const OptionalSatoshiSchema = z
  .number()
  .int()
  .min(0)
  .max(2100000000000000)
  .optional()

export const satoshisPerPunchSchema = z
  .number()
  .int('Satoshis must be an integer')
  .min(100, 'Satoshis per punch must be at least 100')
  .max(100000000, 'Satoshis per punch cannot exceed 1 BSV')

// ============================================
// PROGRAM SCHEMAS
// ============================================

export const requiredPunchesSchema = z
  .number()
  .int('Required punches must be an integer')
  .min(1, 'Required punches must be at least 1')
  .max(1000, 'Required punches cannot exceed 1000')

export const expirationDaysSchema = z
  .number()
  .int('Expiration days must be an integer')
  .min(1, 'Expiration days must be at least 1')
  .max(3650, 'Expiration days cannot exceed 10 years (3650 days)')

export const rewardSchema = z
  .string()
  .min(1, 'Reward description required')
  .max(200, 'Reward description cannot exceed 200 characters')

/**
 * nTangleMint Program Schema
 * Creator identity is blockchain-native via creatorAddress (public address from TX signature)
 */
export const ProgramSchema = z.object({
  id: programIDSchema,
  creatorAddress: BSVAddressSchema.describe('BSV address of program creator (from TX signature)'),
  name: z
    .string()
    .min(3, 'Program name must be at least 3 characters')
    .max(100, 'Program name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: z.enum(['active', 'paused', 'deleted']),
  metadata: z
    .object({
      requiredPunches: requiredPunchesSchema.optional(),
      expirationDays: expirationDaysSchema.optional(),
      satoshisPerPunch: satoshisPerPunchSchema.optional(),
      reward: rewardSchema.optional(),
      expirationDate: z.string().datetime().optional(),
    })
    .optional(),
})

export type ProgramInput = z.infer<typeof ProgramSchema>

/**
 * Program Creation Schema for NEW format
 * creatorWalletID is NOT stored in OP_RETURN (identity derived from TX signature)
 * programName is stored in database, NOT in OP_RETURN
 */
export const ProgramCreationSchema = z.object({
  name: z
    .string()
    .min(3, 'Program name must be at least 3 characters')
    .max(100, 'Program name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  satoshisPerPunch: satoshisPerPunchSchema,
  requiredPunches: requiredPunchesSchema,
  reward: rewardSchema,
  expirationDays: expirationDaysSchema.optional(),
})

export type ProgramCreationInput = z.infer<typeof ProgramCreationSchema>

// ============================================
// PUNCH CARD SCHEMAS
// ============================================

export const punchCountSchema = z
  .number()
  .int('Punch count must be an integer')
  .min(0, 'Punch count cannot be negative')

export const punchCardStatusSchema = z.enum(['active', 'redeemed'], {
  errorMap: () => ({
    message: "Invalid status. Must be 'active' or 'redeemed'",
  }),
})

/**
 * nTangleMint Punch Card Schema
 * Participant identity is blockchain-native via participantAddress (public address from TX signature)
 */
export const PunchCardSchema = z.object({
  txId: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid transaction ID (must be 64-char hex)'),
  programId: programIDSchema,
  participantAddress: BSVAddressSchema.describe('BSV address of punch card participant (from TX signature)'),
  punches: punchCountSchema,
  requiredPunches: requiredPunchesSchema,
  reward: rewardSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completionTxId: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid completion transaction ID').optional(),
  redeemedAt: z.string().datetime().optional(),
  status: punchCardStatusSchema,
})

export type PunchCardInput = z.infer<typeof PunchCardSchema>

/**
 * Punch Recording Schema for participant joining program
 * Uses publicAddress (BSV address) for on-chain record
 */
export const PunchRecordingSchema = z.object({
  publicAddress: BSVAddressSchema.describe('Your BSV address'),
  programId: programIDSchema,
})

export type PunchRecordingInput = z.infer<typeof PunchRecordingSchema>

// ============================================
// TRANSACTION TYPE SCHEMAS
// ============================================

export const transactionTypeSchema = z.enum(
  ['Create', 'nTangle', 'nProcess', 'Redeem', 'Delete'],
  {
    errorMap: () => ({
      message: 'Invalid transaction type. Must be one of: Create, nTangle, nProcess, Redeem, Delete',
    }),
  }
)

export const programTypeSchema = z.enum(['PunchCard'], {
  errorMap: () => ({
    message: 'Invalid program type. Must be PunchCard',
  }),
})

export const opReturnFieldSchema = z.string()

/**
 * Validates complete 14-field OP_RETURN structure (Field 4 removed).
 * All nTangleMint transactions use this consistent 14-field structure.
 */
export const opReturnFieldsSchema = z
  .array(opReturnFieldSchema)
  .length(14, 'OP_RETURN must have exactly 14 fields (0-13)')

// ============================================
// WALLET SCHEMAS
// ============================================

/**
 * Wallet Schema - blockchain-native identity via publicAddress
 */
export const WalletSchema = z.object({
  publicAddress: BSVAddressSchema.describe('BSV P2PKH address (primary wallet identifier)'),
  privateKey: z.string().min(64).max(64),
  mnemonic: z.string(),
  balance: z
    .object({
      confirmed: z.number().int().min(0),
      unconfirmed: z.number().int().min(0),
      total: z.number().int().min(0),
      address: BSVAddressSchema,
    })
    .optional(),
})

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Safe parse wrapper that returns { success, data/error }
 */
export function validateData<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Throw on validation error (for server actions)
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      console.error(`[v0] Validation failed ${context ? `(${context})` : ''}:`, messages)
      throw new Error(`Validation failed: ${messages.join('; ')}`)
    }
    throw error
  }
}