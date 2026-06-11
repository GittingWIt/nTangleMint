/**
 * PunchCard OP_RETURN Field Positions (PunchCard-Specific)
 *
 * Fields 5-8 specific to PunchCard program type.
 * Builds on top of CORE_FIELD_POSITIONS (Fields 0-4).
 *
 * Total OP_RETURN structure: 15 fields (0-14)
 * - Fields 0-4: Core (universal)
 * - Fields 5-8: PunchCard-specific
 * - Fields 9-14: Reserved for future use
 *
 * Used by: punchcard-validator, punchcard-schema builders
 */

export const PUNCHCARD_FIELD_POSITIONS = {
  // PunchCard-specific CREATE fields (Fields 5-8)
  REQUIRED_PUNCHES: 5,       // numeric - total punches needed
  EXPIRATION_DAYS: 6,        // numeric - days until expiration
  REWARD_DESCRIPTION: 7,     // reward description (URL-encoded)
  SATOSHIS_PER_PUNCH: 8,     // numeric - satoshis cost per punch

  // PunchCard-specific PUNCH fields (nTangle/nProcess/Redeem use Field 5 for punch index)
  PUNCH_INDEX: 5,            // numeric - which punch (1=first, x<required=subsequent, x=required=redeem)
  PUNCH_EXPIRATION_DAYS: 6,  // numeric - verify program expiration status
} as const

/**
 * Total PunchCard-specific fields
 */
export const PUNCHCARD_TOTAL_FIELDS = 4

/**
 * Validate numeric string
 */
export function isValidNumericString(value: string): boolean {
  const num = parseInt(value, 10)
  return !isNaN(num) && num > 0
}

/**
 * Validate satoshis value
 */
export function isValidSatoshis(value: string): boolean {
  return isValidNumericString(value)
}

/**
 * Validate punch index
 */
export function isValidPunchIndex(value: string): boolean {
  const num = parseInt(value, 10)
  return !isNaN(num) && num >= 1
}