/**
 * PunchCard Program Parser
 *
 * Extracts PunchCard-specific data from 14-field OP_RETURN array.
 * Handles CREATE transactions and derives program metadata.
 *
 * Field Structure (PunchCard):
 * [0] = nTangleMint
 * [1] = PunchCard (programType)
 * [2] = Create (transactionType)
 * [3] = programID (pid_{12-char-base36})
 * [4] = programName (URL-encoded)
 * [5] = requiredPunches (numeric string)
 * [6] = expirationDays (numeric string)
 * [7] = rewardDescription (URL-encoded)
 * [8] = satoshisPerPunch (numeric string)
 * [9-13] = Reserved for future use
 */

import { CORE_FIELD_POSITIONS } from "@/lib/constants/core-field-positions"
import { PUNCHCARD_FIELD_POSITIONS } from "@/lib/constants/punchcard-field-positions"
import type { OnChainProgram } from "@/lib/types/program"
import type { ProgramParserResult } from "./program-parser-router"

/**
 * Parse PunchCard program from 14-field array
 *
 * @param fields - 14-field array from OP_RETURN
 * @param txId - Transaction ID
 * @param blockHeight - Block height
 * @param timestamp - Transaction timestamp
 * @param creatorAddress - Creator's wallet address
 * @returns ProgramParserResult with OnChainProgram
 */
export function parsePunchCardProgram(
  fields: string[],
  txId: string,
  blockHeight?: number,
  timestamp?: number,
  creatorAddress?: string
): ProgramParserResult {
  if (!fields || fields.length < 9) {
    return { valid: false, errors: ["Insufficient fields for PunchCard parsing"] }
  }

  try {
    // Extract core fields (all programs have these)
    const programId = fields[CORE_FIELD_POSITIONS.PROGRAM_ID]
    const programNameEncoded = fields[CORE_FIELD_POSITIONS.PROGRAM_NAME]

    // Extract PunchCard-specific fields
    const requiredPunchesStr = fields[PUNCHCARD_FIELD_POSITIONS.REQUIRED_PUNCHES]
    const expirationDaysStr = fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS]
    const rewardDescriptionEncoded = fields[PUNCHCARD_FIELD_POSITIONS.REWARD_DESCRIPTION]
    const satoshisPerPunchStr = fields[PUNCHCARD_FIELD_POSITIONS.SATOSHIS_PER_PUNCH]

    // Validate and parse numeric fields
    const requiredPunches = parseInt(requiredPunchesStr || "0", 10)
    const expirationDays = parseInt(expirationDaysStr || "0", 10)
    const satoshisPerPunch = parseInt(satoshisPerPunchStr || "0", 10)

    if (isNaN(requiredPunches) || isNaN(expirationDays) || isNaN(satoshisPerPunch)) {
      return {
        valid: false,
        errors: [
          "PunchCard: Invalid numeric fields",
          `requiredPunches=${requiredPunchesStr}, expirationDays=${expirationDaysStr}, satoshisPerPunch=${satoshisPerPunchStr}`,
        ],
      }
    }

    // Decode URL-encoded strings
    let programName = programNameEncoded
    let rewardDescription = rewardDescriptionEncoded

    try {
      programName = decodeURIComponent(programNameEncoded || "")
      rewardDescription = decodeURIComponent(rewardDescriptionEncoded || "")
    } catch (decodeErr) {
      console.warn(`[PUNCHCARD-PARSER] URL decode error for program ${programId}:`, decodeErr)
      // Continue with encoded strings as fallback
    }

    // Build PunchCard program object
    const program: OnChainProgram = {
      id: programId,
      type: "punch-card",
      name: programName,
      creatorAddress: creatorAddress || "",
      txId: txId || "",
      blockHeight: blockHeight || 0,
      timestamp: timestamp || Date.now(),
      requiredPunches,
      expirationDays,
      reward: rewardDescription,
      data: {
        // PunchCard-specific data stored in generic object
        satoshisPerPunch,
      },
    }

    return { valid: true, program }
  } catch (err) {
    console.error(`[PUNCHCARD-PARSER] Error parsing PunchCard program:`, err)
    return {
      valid: false,
      errors: [`PunchCard parser error: ${(err as Error).message}`],
    }
  }
}