/**
 * Validator Router
 *
 * Central dispatch logic for OP_RETURN validation.
 * Routes to appropriate program-type-specific validator based on Field 1 (ProgramType).
 *
 * Validation flow:
 * 1. Validate core fields (Fields 0-4) via core-validator
 * 2. Extract programType and transactionType from core validation
 * 3. Route to type-specific validator (PunchCard, Loyalty, etc.)
 * 4. Return comprehensive validation result
 *
 * This design enables horizontal scaling: adding new program types only requires
 * adding a new case to this router and creating the corresponding type-specific validator.
 */

import {
    CORE_FIELD_POSITIONS,
    PROGRAM_TYPES_OP_RETURN,
    type ProgramTypeOPReturn,
    type TransactionTypeOPReturn,
  } from '@/lib/constants/core-field-positions'
  import { validateCoreOpReturn, type CoreValidationResult } from './core-validator'
  import { validatePunchCard, type PunchCardValidationResult } from './punchcard-validator'
  
  export interface ValidationResult {
    valid: boolean
    programType?: ProgramTypeOPReturn
    transactionType?: TransactionTypeOPReturn
    errors: string[]
    raw?: string
  }
  
  /**
   * Universal OP_RETURN validator router
   *
   * Entry point for all OP_RETURN validation. Validates core fields first,
   * then routes to type-specific validator based on programType.
   *
   * @param fields - Parsed OP_RETURN fields (15-element string array)
   * @returns ValidationResult with success status, program/transaction types, and errors
   */
  export function validateOpReturn(fields: string[]): ValidationResult {
    // Step 1: Validate core fields (Fields 0-4)
    const coreValidation = validateCoreOpReturn(fields)
    if (!coreValidation.success) {
      return {
        valid: false,
        errors: coreValidation.errors,
        programType: coreValidation.programType,
        transactionType: coreValidation.transactionType,
      }
    }
  
    // Step 2: Extract programType and transactionType from core validation
    const programType = coreValidation.programType
    const transactionType = coreValidation.transactionType
  
    if (!programType || !transactionType) {
      return {
        valid: false,
        errors: ['Failed to extract program type or transaction type from core validation'],
      }
    }
  
    // Step 3: Route to type-specific validator based on programType
    let typeValidation: PunchCardValidationResult | { success: boolean; errors: string[] }
  
    switch (programType) {
      case PROGRAM_TYPES_OP_RETURN.PUNCH_CARD:
        typeValidation = validatePunchCard(fields, transactionType)
        break
  
      // Future program types will be added here
      // case PROGRAM_TYPES_OP_RETURN.LOYALTY:
      //   typeValidation = validateLoyalty(fields, transactionType)
      //   break
  
      default:
        return {
          valid: false,
          errors: [`Unknown program type: "${programType}"`],
          programType: programType as ProgramTypeOPReturn,
        }
    }
  
    // Step 4: Combine core and type-specific validation results
    const allErrors = [...coreValidation.errors, ...typeValidation.errors]
  
    return {
      valid: typeValidation.success && allErrors.length === 0,
      programType,
      transactionType,
      errors: allErrors,
    }
  }  