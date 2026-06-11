/**
 * Core OP_RETURN Validator
 *
 * Validates Fields 0-4 (universal to all program types).
 * This validator is used by all transaction type validators and routers.
 *
 * - Field 0: "nTangleMint" (protocol)
 * - Field 1: Program Type (PunchCard, Loyalty, etc.)
 * - Field 2: Transaction Type (Create, nTangle, nProcess, Redeem, Delete)
 * - Field 3: Program ID (pid_{12-char-base36})
 * - Field 4: Program Name (URL-encoded)
 */

import {
  CORE_FIELD_POSITIONS,
  PROGRAM_TYPES_OP_RETURN,
  TRANSACTION_TYPES_OP_RETURN,
  type ProgramTypeOPReturn,
  type TransactionTypeOPReturn,
  isValidProgramID,
  isValidProgramName,
} from '@/lib/constants/core-field-positions'

export interface CoreValidationResult {
  success: boolean
  errors: string[]
  programType?: ProgramTypeOPReturn
  transactionType?: TransactionTypeOPReturn
}

/**
 * Validate that OP_RETURN is exactly 15 fields (indices 0-14)
 * All fields must be strings
 */
export function validateOpReturnStructure(fields: any): CoreValidationResult {
  const errors: string[] = []

  // Must be array
  if (!Array.isArray(fields)) {
    return {
      success: false,
      errors: ['OP_RETURN must be an array'],
    }
  }

  // Must have exactly 14 fields
  if (fields.length !== 14) {
    errors.push(`OP_RETURN must have exactly 14 fields, got ${fields.length}`)
  }

  // All fields must be strings
  for (let i = 0; i < fields.length; i++) {
    if (typeof fields[i] !== 'string') {
      errors.push(`Field ${i}: Must be string, got ${typeof fields[i]}`)
    }
  }

  return errors.length > 0 ? { success: false, errors } : { success: true, errors: [] }
}

/**
 * Validate core fields (Fields 0-4) present in all transaction types
 */
export function validateCoreFields(fields: string[]): CoreValidationResult {
  const errors: string[] = []

  // Field 0: Protocol identifier
  if (fields[CORE_FIELD_POSITIONS.PROTOCOL] !== 'nTangleMint') {
    errors.push('Field 0: Must be "nTangleMint"')
  }

  // Field 1: Program Type
  const programType = fields[CORE_FIELD_POSITIONS.PROGRAM_TYPE]
  if (!Object.values(PROGRAM_TYPES_OP_RETURN).includes(programType as any)) {
    errors.push(
      `Field 1: Invalid program type "${programType}". Must be one of: ${Object.values(PROGRAM_TYPES_OP_RETURN).join(', ')}`
    )
  }

  // Field 2: Transaction Type
  const transactionType = fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE]
  if (!Object.values(TRANSACTION_TYPES_OP_RETURN).includes(transactionType as any)) {
    errors.push(
      `Field 2: Invalid transaction type "${transactionType}". Must be one of: ${Object.values(TRANSACTION_TYPES_OP_RETURN).join(', ')}`
    )
  }

  // Field 3: Program ID
  if (!isValidProgramID(fields[CORE_FIELD_POSITIONS.PROGRAM_ID])) {
    errors.push('Field 3: Invalid program ID format (must be pid_{12-char-base36})')
  }

  // Field 4: Program Name
  if (!isValidProgramName(fields[CORE_FIELD_POSITIONS.PROGRAM_NAME])) {
    errors.push('Field 4: Invalid program name (must be 1-255 characters when decoded)')
  }

  return errors.length > 0
    ? { success: false, errors, programType: programType as ProgramTypeOPReturn, transactionType: transactionType as TransactionTypeOPReturn }
    : { success: true, errors: [], programType: programType as ProgramTypeOPReturn, transactionType: transactionType as TransactionTypeOPReturn }
}

/**
 * Universal core validator - validates Fields 0-4 structure
 * Used by all program types before routing to type-specific validators
 */
export function validateCoreOpReturn(fields: string[]): CoreValidationResult {
  // First validate structure
  const structureValidation = validateOpReturnStructure(fields)
  if (!structureValidation.success) {
    return structureValidation
  }

  // Validate core fields to extract program and transaction types
  return validateCoreFields(fields)
}