/**
 * PunchCard OP_RETURN Schema (PunchCard-Specific)
 *
 * Extends CoreTransactionSchema with PunchCard-specific fields (5-8).
 * Separate transaction types: CREATE, PUNCH (nTangle/nProcess/Redeem)
 *
 * Total structure: 15 fields (0-14)
 * - Fields 0-4: Core (from core-schema.ts)
 * - Fields 5-8: PunchCard-specific
 * - Fields 9-14: Reserved
 */

import {
  PROGRAM_TYPES_OP_RETURN,
  TRANSACTION_TYPES_OP_RETURN,
  isValidProgramID,
  isValidProgramName,
} from './core-field-positions'
import type { CoreTransactionSchema, TransactionCategory } from './core-schema'
import {
  PUNCHCARD_FIELD_POSITIONS,
  isValidNumericString,
  isValidPunchIndex,
} from './punchcard-field-positions'

// ============================================================================
// CREATE Transaction Type (PunchCard-specific)
// Program registration / loyalty card creation
// ============================================================================

export interface PunchCardCreateSchema extends CoreTransactionSchema {
  field1: "PunchCard"
  field2: "Create"
  field5: string // requiredPunches (numeric string, e.g., "6")
  field6: string // expirationDays (numeric string, e.g., "365")
  field7: string // rewardDescription (URL-encoded, e.g., "Free%20Coffee")
  field8: string // satoshisPerPunch (numeric string, e.g., "500")
  // Fields 9-14: Reserved
}

export function buildPunchCardCreateTransaction(
  programID: string,
  programName: string,
  requiredPunches: number,
  expirationDays: number,
  rewardDescription: string,
  satoshisPerPunch: number
): PunchCardCreateSchema {
  return {
    field0: "nTangleMint",
    field1: PROGRAM_TYPES_OP_RETURN.PUNCH_CARD,
    field2: TRANSACTION_TYPES_OP_RETURN.CREATE,
    field3: programID,
    field4: encodeURIComponent(programName),
    field5: requiredPunches.toString(),
    field6: expirationDays.toString(),
    field7: encodeURIComponent(rewardDescription),
    field8: satoshisPerPunch.toString(),
  }
}

// ============================================================================
// PUNCH Transaction Types (PunchCard-specific)
// nTangle: First punch / participant joins
// nProcess: Subsequent punch
// Redeem: Final punch / claim reward
// ============================================================================

export interface PunchCardPunchSchema extends CoreTransactionSchema {
  field1: "PunchCard"
  field2: "nTangle" | "nProcess" | "Redeem"
  field5: string // punchIndex (numeric string, e.g., "1", "3", "6")
  field6: string // expirationDays (verify program still valid)
  // Fields 7-14: Reserved
}

export function buildPunchCardNTangleTransaction(
  programID: string,
  programName: string,
  expirationDays: number
): PunchCardPunchSchema {
  return {
    field0: "nTangleMint",
    field1: PROGRAM_TYPES_OP_RETURN.PUNCH_CARD,
    field2: TRANSACTION_TYPES_OP_RETURN.NTANGLE,
    field3: programID,
    field4: encodeURIComponent(programName),
    field5: "1", // First punch is always index 1
    field6: expirationDays.toString(),
  }
}

export function buildPunchCardNProcessTransaction(
  programID: string,
  programName: string,
  punchIndex: number,
  expirationDays: number
): PunchCardPunchSchema {
  return {
    field0: "nTangleMint",
    field1: PROGRAM_TYPES_OP_RETURN.PUNCH_CARD,
    field2: TRANSACTION_TYPES_OP_RETURN.NPROCESS,
    field3: programID,
    field4: encodeURIComponent(programName),
    field5: punchIndex.toString(),
    field6: expirationDays.toString(),
  }
}

export function buildPunchCardRedeemTransaction(
  programID: string,
  programName: string,
  punchIndex: number,
  expirationDays: number
): PunchCardPunchSchema {
  return {
    field0: "nTangleMint",
    field1: PROGRAM_TYPES_OP_RETURN.PUNCH_CARD,
    field2: TRANSACTION_TYPES_OP_RETURN.REDEEM,
    field3: programID,
    field4: encodeURIComponent(programName),
    field5: punchIndex.toString(),
    field6: expirationDays.toString(),
  }
}

// ============================================================================
// DELETE Transaction Type (PunchCard-specific)
// Program deletion / removal from circulation
// ============================================================================

export interface PunchCardDeleteSchema extends CoreTransactionSchema {
  field1: "PunchCard"
  field2: "Delete"
  // Fields 5-14: Reserved
}

export function buildPunchCardDeleteTransaction(
  programID: string,
  programName: string
): PunchCardDeleteSchema {
  return {
    field0: "nTangleMint",
    field1: PROGRAM_TYPES_OP_RETURN.PUNCH_CARD,
    field2: TRANSACTION_TYPES_OP_RETURN.DELETE,
    field3: programID,
    field4: encodeURIComponent(programName),
  }
}

// ============================================================================
// Validation & Extraction
// ============================================================================
export function validatePunchCardCreateFields(fields: string[]): boolean {
  if (!Array.isArray(fields) || fields.length < 9) return false

  const requiredPunches = fields[PUNCHCARD_FIELD_POSITIONS.REQUIRED_PUNCHES]
  const expirationDays = fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS]
  const rewardDescription = fields[PUNCHCARD_FIELD_POSITIONS.REWARD_DESCRIPTION]
  const satoshisPerPunch = fields[PUNCHCARD_FIELD_POSITIONS.SATOSHIS_PER_PUNCH]

  return (
    typeof requiredPunches === "string" &&
    isValidNumericString(requiredPunches) &&
    typeof expirationDays === "string" &&
    isValidNumericString(expirationDays) &&
    typeof rewardDescription === "string" &&
    rewardDescription.length > 0 &&
    typeof satoshisPerPunch === "string" &&
    isValidNumericString(satoshisPerPunch)
  )
}

/**
 * Validate PunchCard PUNCH fields (Fields 5-6)
 * Used by nTangle, nProcess, Redeem
 */
export function validatePunchCardPunchFields(fields: string[]): boolean {
  if (fields.length < 7) return false

  const punchIndex = fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_INDEX]
  const expirationDays = fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_EXPIRATION_DAYS]

  return isValidPunchIndex(punchIndex) && isValidNumericString(expirationDays)
}

/**
 * Extract PunchCard CREATE data
 */
export interface ExtractedPunchCardCreateData {
  requiredPunches: number
  expirationDays: number
  rewardDescription: string
  satoshisPerPunch: number
}

export function extractPunchCardCreateData(fields: string[]): ExtractedPunchCardCreateData | null {
  if (!validatePunchCardCreateFields(fields)) {
    return null
  }

  try {
    const rewardDescription = decodeURIComponent(
      fields[PUNCHCARD_FIELD_POSITIONS.REWARD_DESCRIPTION]
    )

    return {
      requiredPunches: parseInt(fields[PUNCHCARD_FIELD_POSITIONS.REQUIRED_PUNCHES], 10),
      expirationDays: parseInt(fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS], 10),
      rewardDescription,
      satoshisPerPunch: parseInt(fields[PUNCHCARD_FIELD_POSITIONS.SATOSHIS_PER_PUNCH], 10),
    }
  } catch (e) {
    return null
  }
}

/**
 * Extract PunchCard PUNCH data
 */
export interface ExtractedPunchCardPunchData {
  punchIndex: number
  expirationDays: number
}

export function extractPunchCardPunchData(fields: string[]): ExtractedPunchCardPunchData | null {
  if (!validatePunchCardPunchFields(fields)) {
    return null
  }

  return {
    punchIndex: parseInt(fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_INDEX], 10),
    expirationDays: parseInt(fields[PUNCHCARD_FIELD_POSITIONS.PUNCH_EXPIRATION_DAYS], 10),
  }
}