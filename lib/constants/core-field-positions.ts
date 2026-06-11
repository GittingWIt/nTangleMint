/**
 * nTangleMint Core OP_RETURN Field Positions
 *
 * Universal fields (0-4) shared by ALL program types.
 * Single source of truth for core fields across the application.
 *
 * Used by: parser, validators, all program types, routes
 */

export const CORE_FIELD_POSITIONS = {
    // Universal fields (all transactions, all program types)
    PROTOCOL: 0,               // "nTangleMint" - Protocol identifier
    PROGRAM_TYPE: 1,           // "PunchCard", "Loyalty", "Coupon", etc.
    TRANSACTION_TYPE: 2,       // "Create", "nTangle", "nProcess", "Redeem", "Delete"
    PROGRAM_ID: 3,             // "pid_{12-char-base36}"
    PROGRAM_NAME: 4,           // Program name (URL-encoded, immutable)
  } as const
  
  /**
   * Total core fields (universal to all program types)
   * Fields 5-14 are program-type-specific or reserved
   */
  export const CORE_TOTAL_FIELDS = 5
  
  /**
   * Program Types - First-class part of OP_RETURN
   * Extensible for future program types
   */
  export const PROGRAM_TYPES_OP_RETURN = {
    PUNCH_CARD: "PunchCard",
    // Future types:
    // LOYALTY: "Loyalty",
    // COUPON: "Coupon",
    // SUBSCRIPTION: "Subscription",
  } as const
  
  export type ProgramTypeOPReturn = typeof PROGRAM_TYPES_OP_RETURN[keyof typeof PROGRAM_TYPES_OP_RETURN]
  
  /**
   * Transaction Types - Universal across all program types
   */
  export const TRANSACTION_TYPES_OP_RETURN = {
    CREATE: "Create",
    NTANGLE: "nTangle",      // First punch, participant joins
    NPROCESS: "nProcess",    // Subsequent punch
    REDEEM: "Redeem",        // Final punch, claim reward
    DELETE: "Delete",        // Program deletion
  } as const
  
  export type TransactionTypeOPReturn = typeof TRANSACTION_TYPES_OP_RETURN[keyof typeof TRANSACTION_TYPES_OP_RETURN]
  
  /**
   * Validate program ID format
   */
  export function isValidProgramID(programID: string): boolean {
    return /^pid_[0-9a-z]{12}$/.test(programID)
  }
  
  /**
   * Validate program name (URL-encoded string)
   */
  export function isValidProgramName(name: string): boolean {
    return typeof name === "string" && name.length > 0 && name.length <= 255
  }