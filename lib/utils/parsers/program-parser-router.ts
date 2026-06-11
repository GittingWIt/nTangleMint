/**
 * Program Parser Router
 *
 * Routes program extraction based on programType (Field 1) to type-specific parsers.
 * This enables horizontal scaling - add new program types without modifying existing logic.
 *
 * Architecture:
 * - Receives 14-field array from OP_RETURN parser
 * - Detects programType from Field 1
 * - Routes to appropriate type-specific parser
 * - Returns consistent OnChainProgram object regardless of type
 */

import { CORE_FIELD_POSITIONS, PROGRAM_TYPES_OP_RETURN } from "@/lib/constants/core-field-positions"
import type { OnChainProgram } from "@/lib/types/program"
import { parsePunchCardProgram } from "./punchcard-program-parser"

export type { OnChainProgram }

export interface ProgramParserResult {
  valid: boolean
  program?: OnChainProgram
  errors?: string[]
}

/**
 * Parse and extract program data from 14-field OP_RETURN array
 * Routes to type-specific parser based on programType
 *
 * @param fields - 14-field array from parseNTangleMintOpReturn
 * @param txId - Transaction ID for program reference
 * @param blockHeight - Block height for timestamp
 * @param timestamp - Transaction timestamp
 * @param creatorAddress - Address that created the program
 * @returns OnChainProgram with type-specific data
 */
export function parseProgramFromFields(
  fields: string[],
  txId: string,
  blockHeight?: number,
  timestamp?: number,
  creatorAddress?: string
): ProgramParserResult {
  if (!fields || fields.length < 5) {
    return { valid: false, errors: ["Insufficient fields for program parsing"] }
  }

  // Extract core fields common to all programs
  const programType = fields[CORE_FIELD_POSITIONS.PROGRAM_TYPE]
  const programId = fields[CORE_FIELD_POSITIONS.PROGRAM_ID]
  const programName = fields[CORE_FIELD_POSITIONS.PROGRAM_NAME]

  // Validate core fields
  if (!programType || !programId || !programName) {
    return {
      valid: false,
      errors: [
        `Missing core fields: type=${programType}, id=${programId}, name=${programName}`,
      ],
    }
  }

  // Route to type-specific parser
  try {
    switch (programType) {
      case PROGRAM_TYPES_OP_RETURN.PUNCH_CARD:
        return parsePunchCardProgram(fields, txId, blockHeight, timestamp, creatorAddress)

      // Future program types will be added here without modifying existing logic
      // case PROGRAM_TYPES_OP_RETURN.LOYALTY:
      //   return parseLoyaltyProgram(fields, txId, blockHeight, timestamp, creatorAddress)

      default:
        return {
          valid: false,
          errors: [`Unknown program type: ${programType}`],
        }
    }
  } catch (err) {
    console.error(`[PROGRAM-PARSER-ROUTER] Error parsing ${programType} program:`, err)
    return {
      valid: false,
      errors: [`Parser error for ${programType}: ${(err as Error).message}`],
    }
  }
}