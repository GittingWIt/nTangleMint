import { z } from 'zod'

/**
 * Central Zod schemas for all validation
 * Source of truth for data validation across the application
 * Used by both client-side forms and server-side validators
 */

// ============================================
// ADDRESS SCHEMAS
// ============================================

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

// ============================================
// PROGRAM SCHEMAS
// ============================================

export const ProgramCreationSchema = z.object({
  name: z
    .string()
    .min(3, 'Program name must be at least 3 characters')
    .max(50, 'Program name must be less than 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  merchantAddress: BSVAddressSchema,
  satoshisPerPunch: SatoshiAmountSchema,
  requiredPunches: z
    .number()
    .int()
    .min(1, 'Must require at least 1 punch')
    .max(100, 'Cannot require more than 100 punches'),
  programType: z.enum(['accumulation', 'bogo']),
  bogoRewardDescription: z
    .string()
    .max(100, 'Reward description must be less than 100 characters')
    .optional(),
})

export type ProgramCreationInput = z.infer<typeof ProgramCreationSchema>

export const ProgramMetadataSchema = z.object({
  programType: z.enum(['accumulation', 'bogo']).optional(),
  bogoRewardDescription: z.string().optional(),
})

// ============================================
// PUNCH CARD SCHEMAS
// ============================================

export const PunchCardSchema = z.object({
  id: z.string().uuid(),
  programId: z.string(),
  customerAddress: BSVAddressSchema,
  punches: z.number().int().min(0),
  requiredPunches: z.number().int().min(1),
  status: z.enum(['active', 'completed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
})

export const PunchRecordingSchema = z.object({
  customerAddress: BSVAddressSchema,
  programId: z.string(),
})

export type PunchRecordingInput = z.infer<typeof PunchRecordingSchema>

// ============================================
// WALLET SCHEMAS
// ============================================

export const WalletSchema = z.object({
  address: BSVAddressSchema,
  privateKey: z.string().min(64).max(64), // WIF format
  publicKey: z.string(),
  balance: z.number().int().min(0),
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