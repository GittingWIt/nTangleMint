/**
 * PunchCard-Specific Validator
 *
 * Validates Fields 5-8 (PunchCard-specific) for all PunchCard transaction types.
 * This validator handles: CREATE, nTangle (first punch), nProcess (subsequent punch), Redeem, Delete
 *
 * - Field 5: Varies by transaction type (requiredPunches for CREATE, punchIndex for punch types)
 * - Field 6: Varies by transaction type (expirationDays for CREATE, expirationDays for punch types)
 * - Field 7: rewardDescription (CREATE only)
 * - Field 8: satoshisPerPunch (CREATE only)
 */

import {
    CORE_FIELD_POSITIONS,
    TRANSACTION_TYPES_OP_RETURN,
    type TransactionTypeOPReturn,
  } from '@/lib/constants/core-field-positions'
  import {
    PUNCHCARD_FIELD_POSITIONS,
    isValidNumericString,
  } from '@/lib/constants/punchcard-field-positions'
  import { validatePunchCardCreateFields } from '@/lib/constants/punchcard-schema'
  
  export interface PunchCardValidationResult {
    success: boolean
    errors: string[]
    programType?: 'PunchCard'
    transactionType?: TransactionTypeOPReturn
  }
  
  /**
   * Validate PunchCard CREATE transaction
   * Fields: nTangleMint | PunchCard | Create | pid_xxx | programName | requiredPunches | expirationDays | rewardDescription | satoshisPerPunch | ... (reserved)
   */
  export function validatePunchCardCreate(fields: string[]): PunchCardValidationResult {
    const errors: string[] = []
  
    // Verify Fields 0-4 are already validated by core validator
    // Verify transaction type is "Create"
    if (fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] !== TRANSACTION_TYPES_OP_RETURN.CREATE) {
      return {
        success: false,
        errors: ['Field 2: Must be "Create" for PunchCard CREATE transaction'],
        programType: 'PunchCard',
        transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] as TransactionTypeOPReturn,
      }
    }
  
    // Use helper to validate Fields 5-8
    if (!validatePunchCardCreateFields(fields)) {
      errors.push('Fields 5-8: Invalid PunchCard CREATE fields')
      errors.push('Field 5: requiredPunches must be a numeric string (1-1000)')
      errors.push('Field 6: expirationDays must be a numeric string (1-3650)')
      errors.push('Field 7: rewardDescription must be URL-encoded (1-200 chars decoded)')
      errors.push('Field 8: satoshisPerPunch must be a numeric string (100-100000000)')
    }
  
    // Fields 9-14 should be empty (reserved)
    for (let i = 9; i <= 14; i++) {
      if (fields[i] && fields[i].trim() !== '') {
        errors.push(`Field ${i}: Reserved field must be empty`)
      }
    }
  
    return {
      success: errors.length === 0,
      errors,
      programType: 'PunchCard',
      transactionType: TRANSACTION_TYPES_OP_RETURN.CREATE,
    }
  }
  
  /**
   * Validate PunchCard nTangle transaction (first punch)
   * Fields: nTangleMint | PunchCard | nTangle | pid_xxx | programName | 1 | expirationDays | (reserved) | (reserved) | ... (reserved)
   */
  export function validatePunchCardNTangle(fields: string[]): PunchCardValidationResult {
    const errors: string[] = []
  
    // Verify transaction type is "nTangle"
    if (fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] !== TRANSACTION_TYPES_OP_RETURN.NTANGLE) {
      return {
        success: false,
        errors: ['Field 2: Must be "nTangle" for PunchCard nTangle transaction'],
        programType: 'PunchCard',
        transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] as TransactionTypeOPReturn,
      }
    }
  
    // Field 5: punchIndex must be "1" for nTangle (first punch)
    const punchIndex = fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_INDEX]
    if (punchIndex !== '1') {
      errors.push('Field 5: nTangle punchIndex must be "1" (first punch)')
    }
  
    // Field 6: expirationDays (verify it's numeric if present)
    const expirationDays = fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS]
    if (expirationDays && !isValidNumericString(expirationDays)) {
      errors.push('Field 6: expirationDays must be a numeric string')
    }
  
    // Fields 7-14 should be empty (reserved)
    for (let i = 7; i <= 14; i++) {
      if (fields[i] && fields[i].trim() !== '') {
        errors.push(`Field ${i}: Reserved field must be empty`)
      }
    }
  
    return {
      success: errors.length === 0,
      errors,
      programType: 'PunchCard',
      transactionType: TRANSACTION_TYPES_OP_RETURN.NTANGLE,
    }
  }
  
  /**
   * Validate PunchCard nProcess transaction (subsequent punch)
   * Fields: nTangleMint | PunchCard | nProcess | pid_xxx | programName | punchIndex | expirationDays | (reserved) | (reserved) | ... (reserved)
   */
  export function validatePunchCardNProcess(fields: string[]): PunchCardValidationResult {
    const errors: string[] = []
  
    // Verify transaction type is "nProcess"
    if (fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] !== TRANSACTION_TYPES_OP_RETURN.NPROCESS) {
      return {
        success: false,
        errors: ['Field 2: Must be "nProcess" for PunchCard nProcess transaction'],
        programType: 'PunchCard',
        transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] as TransactionTypeOPReturn,
      }
    }
  
    // Field 5: punchIndex (must be > 1, will be validated against requiredPunches by application)
    const punchIndex = fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_INDEX]
    if (!isValidNumericString(punchIndex)) {
      errors.push('Field 5: punchIndex must be a positive integer')
    } else if (parseInt(punchIndex, 10) <= 1) {
      errors.push('Field 5: nProcess punchIndex must be > 1 (use nTangle for first punch)')
    }
  
    // Field 6: expirationDays (verify it's numeric if present)
    const expirationDays = fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS]
    if (expirationDays && !isValidNumericString(expirationDays)) {
      errors.push('Field 6: expirationDays must be a numeric string')
    }
  
    // Fields 7-14 should be empty (reserved)
    for (let i = 7; i <= 14; i++) {
      if (fields[i] && fields[i].trim() !== '') {
        errors.push(`Field ${i}: Reserved field must be empty`)
      }
    }
  
    return {
      success: errors.length === 0,
      errors,
      programType: 'PunchCard',
      transactionType: TRANSACTION_TYPES_OP_RETURN.NPROCESS,
    }
  }
  
  /**
   * Validate PunchCard Redeem transaction (claim reward)
   * Fields: nTangleMint | PunchCard | Redeem | pid_xxx | programName | punchIndex | expirationDays | (reserved) | (reserved) | ... (reserved)
   */
  export function validatePunchCardRedeem(fields: string[]): PunchCardValidationResult {
    const errors: string[] = []
  
    // Verify transaction type is "Redeem"
    if (fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] !== TRANSACTION_TYPES_OP_RETURN.REDEEM) {
      return {
        success: false,
        errors: ['Field 2: Must be "Redeem" for PunchCard Redeem transaction'],
        programType: 'PunchCard',
        transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] as TransactionTypeOPReturn,
      }
    }
  
    // Field 5: punchIndex (should equal requiredPunches, validated by application)
    const punchIndex = fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_INDEX]
    if (!isValidNumericString(punchIndex)) {
      errors.push('Field 5: punchIndex must be a positive integer')
    }
  
    // Field 6: expirationDays (verify not expired)
    const expirationDays = fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS]
    if (expirationDays && !isValidNumericString(expirationDays)) {
      errors.push('Field 6: expirationDays must be a numeric string')
    }
  
    // Fields 7-14 should be empty (reserved)
    for (let i = 7; i <= 14; i++) {
      if (fields[i] && fields[i].trim() !== '') {
        errors.push(`Field ${i}: Reserved field must be empty`)
      }
    }
  
    return {
      success: errors.length === 0,
      errors,
      programType: 'PunchCard',
      transactionType: TRANSACTION_TYPES_OP_RETURN.REDEEM,
    }
  }
  
  /**
   * Validate PunchCard Delete transaction (program deletion)
   * Fields: nTangleMint | PunchCard | Delete | pid_xxx | programName | (reserved) | (reserved) | (reserved) | (reserved) | ... (reserved)
   * Note: Only creator can delete, and only if no participants exist
   */
  export function validatePunchCardDelete(fields: string[]): PunchCardValidationResult {
    const errors: string[] = []
  
    // Verify transaction type is "Delete"
    if (fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] !== TRANSACTION_TYPES_OP_RETURN.DELETE) {
      return {
        success: false,
        errors: ['Field 2: Must be "Delete" for PunchCard Delete transaction'],
        programType: 'PunchCard',
        transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE] as TransactionTypeOPReturn,
      }
    }
  
    // Fields 5-14 should be empty (reserved)
    for (let i = 5; i <= 14; i++) {
      if (fields[i] && fields[i].trim() !== '') {
        errors.push(`Field ${i}: Reserved field must be empty`)
      }
    }
  
    return {
      success: errors.length === 0,
      errors,
      programType: 'PunchCard',
      transactionType: TRANSACTION_TYPES_OP_RETURN.DELETE,
    }
  }
  
  /**
   * Route to appropriate PunchCard validator based on transaction type
   */
  export function validatePunchCard(
    fields: string[],
    transactionType: TransactionTypeOPReturn
  ): PunchCardValidationResult {
    switch (transactionType) {
      case TRANSACTION_TYPES_OP_RETURN.CREATE:
        return validatePunchCardCreate(fields)
      case TRANSACTION_TYPES_OP_RETURN.NTANGLE:
        return validatePunchCardNTangle(fields)
      case TRANSACTION_TYPES_OP_RETURN.NPROCESS:
        return validatePunchCardNProcess(fields)
      case TRANSACTION_TYPES_OP_RETURN.REDEEM:
        return validatePunchCardRedeem(fields)
      case TRANSACTION_TYPES_OP_RETURN.DELETE:
        return validatePunchCardDelete(fields)
      default:
        return {
          success: false,
          errors: [`Unknown transaction type for PunchCard: "${transactionType}"`],
          programType: 'PunchCard',
        }
    }
  }  