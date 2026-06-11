/**
 * nTangleMint Core OP_RETURN Schema
 *
 * Universal schema for Fields 0-4 (shared by all program types).
 * Program-type-specific fields (5+) are defined in type-specific schema files.
 *
 * KEY DESIGN:
 * - Fields 0-4: Universal (nTangleMint, ProgramType, TransactionType, ProgramID, ProgramName)
 * - Fields 5-8: Program-type-specific (defined in punchcard-schema.ts, loyalty-schema.ts, etc.)
 * - Fields 9-14: Reserved for future use
 *
 * This separation enables horizontal scalability for new program types
 * without modifying core validation logic.
 */

import {
    CORE_FIELD_POSITIONS,
    PROGRAM_TYPES_OP_RETURN,
    TRANSACTION_TYPES_OP_RETURN,
    type ProgramTypeOPReturn,
    type TransactionTypeOPReturn,
    isValidProgramID,
    isValidProgramName,
  } from './core-field-positions'
  
  /**
   * Core OP_RETURN Field Structure (Fields 0-4, universal to all transactions)
   *
   * Field 0: "nTangleMint" (protocol identifier - immutable)
   * Field 1: Program Type (identifies program class: "PunchCard", "Loyalty", etc.)
   * Field 2: Transaction Type (identifies action: "Create", "nTangle", "nProcess", "Redeem", "Delete")
   * Field 3: Program ID ("pid_{12-char-base36}" - unique program identifier)
   * Field 4: Program Name (URL-encoded, immutable across all transaction types)
   *
   * NOTE: Field 4 was previously "BSV TX ID" but is now "Program Name".
   * BSV TX ID is already available as native transaction metadata (tx.txid).
   */
  
  export interface CoreTransactionSchema {
    field0: "nTangleMint"
    field1: ProgramTypeOPReturn // "PunchCard" | "Loyalty" | etc.
    field2: TransactionTypeOPReturn // "Create" | "nTangle" | "nProcess" | "Redeem" | "Delete"
    field3: string // programID (pid_{12-char-base36})
    field4: string // programName (URL-encoded)
    // Fields 5-14: Program-type-specific (see punchcard-schema.ts, loyalty-schema.ts, etc.)
  }
  
  /**
   * Build core fields common to all transaction types
   * Caller must append type-specific fields (5+)
   */
  export function buildCoreFields(
    programType: ProgramTypeOPReturn,
    transactionType: TransactionTypeOPReturn,
    programID: string,
    programName: string
  ): [string, string, string, string, string] {
    return [
      "nTangleMint",
      programType,
      transactionType,
      programID,
      encodeURIComponent(programName),
    ]
  }
  
  /**
   * Extract and validate core fields (0-4)
   * Returns validated fields or null if any core field is invalid
   */
  export interface ValidatedCoreFields {
    programType: ProgramTypeOPReturn
    transactionType: TransactionTypeOPReturn
    programID: string
    programName: string
  }
  
  export function validateAndExtractCoreFields(fields: string[]): ValidatedCoreFields | null {
    if (!fields || fields.length < 5) {
      return null
    }
  
    // Field 0: Protocol marker
    if (fields[CORE_FIELD_POSITIONS.PROTOCOL] !== "nTangleMint") {
      return null
    }
  
    // Field 1: Program type
    const programType = fields[CORE_FIELD_POSITIONS.PROGRAM_TYPE]
    if (!Object.values(PROGRAM_TYPES_OP_RETURN).includes(programType as ProgramTypeOPReturn)) {
      return null
    }
  
    // Field 2: Transaction type
    const transactionType = fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE]
    if (!Object.values(TRANSACTION_TYPES_OP_RETURN).includes(transactionType as TransactionTypeOPReturn)) {
      return null
    }
  
    // Field 3: Program ID
    const programID = fields[CORE_FIELD_POSITIONS.PROGRAM_ID]
    if (!isValidProgramID(programID)) {
      return null
    }
  
    // Field 4: Program name
    const programNameEncoded = fields[CORE_FIELD_POSITIONS.PROGRAM_NAME]
    let programName: string
    try {
      programName = decodeURIComponent(programNameEncoded)
    } catch (e) {
      return null
    }
  
    if (!isValidProgramName(programName)) {
      return null
    }
  
    return {
      programType: programType as ProgramTypeOPReturn,
      transactionType: transactionType as TransactionTypeOPReturn,
      programID,
      programName,
    }
  }
  
  /**
   * Get transaction type category
   * Useful for determining which type-specific fields to expect
   */
  export type TransactionCategory = "create" | "punch" | "delete"
  
  export function getTransactionCategory(transactionType: TransactionTypeOPReturn): TransactionCategory {
    if (transactionType === TRANSACTION_TYPES_OP_RETURN.CREATE) {
      return "create"
    }
    if (
      transactionType === TRANSACTION_TYPES_OP_RETURN.NTANGLE ||
      transactionType === TRANSACTION_TYPES_OP_RETURN.NPROCESS ||
      transactionType === TRANSACTION_TYPES_OP_RETURN.REDEEM
    ) {
      return "punch"
    }
    if (transactionType === TRANSACTION_TYPES_OP_RETURN.DELETE) {
      return "delete"
    }
    throw new Error(`Unknown transaction type: ${transactionType}`)
  }  