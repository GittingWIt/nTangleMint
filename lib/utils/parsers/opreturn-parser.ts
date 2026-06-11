/**
 * Shared OP_RETURN Parser for nTangleMint Transactions
 *
 * This utility provides a single, canonical parser for extracting and parsing
 * nTangleMint OP_RETURN data from BSV transactions. It handles both formats:
 * - Pre-parsed format: WhatsOnChain's opReturn.parts array
 * - Raw hex format: scriptPubKey.hex requiring manual decoding
 *
 * All routes (transactions, onchain-state) should use this parser to ensure
 * consistent parsing logic across the application.
 */

import { validateOpReturn, ValidationResult } from "@/lib/validation/validator-router"
import {
  CORE_FIELD_POSITIONS,
  TRANSACTION_TYPES_OP_RETURN,
} from "@/lib/constants/core-field-positions"

// ============================================================================
// Type Definitions
// ============================================================================

export interface ParsedOpReturn {
  valid: boolean
  fields?: string[] // 14-field array if valid
  transactionType?: string
  errors?: string[]
  raw?: string // Original unparsed string for debugging
}

export interface WhatsOnChainTx {
  txid: string
  vout?: Array<{
    scriptPubKey?: {
      opReturn?: {
        parts?: string[]
      } | string
      hex?: string
      type?: string
    }
  }>
  [key: string]: any
}

// ============================================================================
// Core Parsing Functions
// ============================================================================

/**
 * Extract OP_RETURN data from transaction vout
 * WhatsOnChain pre-parses OP_RETURN into parts[0] as URL-encoded string
 * OR returns each field as a separate element in the parts array
 */
function extractOpReturnData(vout: any[]): string | null {
  if (!Array.isArray(vout)) {
    console.log("[OPRETURN-PARSER] vout not an array")
    return null
  }

  for (const output of vout) {
    // WhatsOnChain pre-parsed format: opReturn.parts is an array
    if (output.scriptPubKey?.opReturn && typeof output.scriptPubKey.opReturn === "object") {
      const opReturnData = output.scriptPubKey.opReturn as any

      // Case 1: parts is an array of strings where parts[0] is the full pipe-separated string
      if (Array.isArray(opReturnData.parts) && opReturnData.parts[0]) {
        console.log("[OPRETURN-PARSER] Found opReturn.parts[0] (pre-parsed)")
        
        // If parts.length > 1 AND parts[0] doesn't contain pipes, it's already split
        // Join it back into a pipe-separated string
        if (opReturnData.parts.length > 1 && !opReturnData.parts[0].includes("|")) {
          console.log(`[OPRETURN-PARSER] Parts array has ${opReturnData.parts.length} elements, joining with pipes`)
          return opReturnData.parts.join("|")
        }
        
        // Otherwise, parts[0] is already the full pipe-separated string
        return opReturnData.parts[0]
      }
    }

    // Fallback: try raw hex format (scriptPubKey.hex)
    if (output.scriptPubKey?.hex && output.scriptPubKey.type === "nulldata") {
      console.log("[OPRETURN-PARSER] Found scriptPubKey.hex (raw hex), length:", output.scriptPubKey.hex.length)
      return output.scriptPubKey.hex
    }
  }

  console.log("[OPRETURN-PARSER] No OP_RETURN data found in vout")
  return null
}

/**
 * Decode OP_RETURN data to string
 * Handles both URL-encoded strings and raw hex
 */
function decodeOpReturnString(data: string): string | null {
  if (!data) {
    return null
  }

  try {
    // If it contains %, try URL decoding first (pre-parsed from WhatsOnChain)
    if (data.includes("%")) {
      try {
        const decoded = decodeURIComponent(data)
        if (decoded.includes("nTangleMint")) {
          return decoded
        }
      } catch (e) {
        // URL decode failed, try next approach
      }
    }

    // If already unencoded and contains nTangleMint, return as-is
    if (data.includes("nTangleMint")) {
      return data
    }

    // Try hex decoding (for raw format)
    if (/^[0-9a-fA-F]+$/.test(data)) {
      // Remove OP_RETURN prefix (6a) if present
      let cleanHex = data.startsWith("6a") ? data.substring(2) : data

      // Handle VARINT length prefix (common in BSV OP_RETURN)
      // If first byte is length indicator (e.g., 4d for 100+ bytes), skip it
      // Common prefixes: 4c (OP_PUSHDATA1), 4d (OP_PUSHDATA2), 4e (OP_PUSHDATA4)
      if (cleanHex.startsWith("4c") || cleanHex.startsWith("4d") || cleanHex.startsWith("4e")) {
        // Skip the push opcode and length bytes
        if (cleanHex.startsWith("4c")) {
          cleanHex = cleanHex.substring(4) // Skip 4c + 2 hex chars for length
        } else if (cleanHex.startsWith("4d")) {
          cleanHex = cleanHex.substring(8) // Skip 4d + 4 hex chars for length
        } else {
          cleanHex = cleanHex.substring(8) // Skip 4e + 4 hex chars for length
        }
      }

      if (cleanHex.length % 2 !== 0) {
        return null
      }

      const buffer = Buffer.from(cleanHex, "hex")
      const decoded = buffer.toString("utf-8")

      console.log("[OPRETURN-PARSER] Hex decoded successfully, first 50 chars:", decoded.substring(0, 50))

      // Validate it's valid UTF-8 and contains nTangleMint
      if (decoded.includes("nTangleMint")) {
        return decoded
      }
    }

    return null
  } catch (err) {
    console.warn("[OPRETURN-PARSER] Decode error:", err)
    return null
  }
}

/**
 * Parse OP_RETURN string into 14-field array
 * Splits by pipe delimiter and ensures exactly 14 fields
 */
function parseOpReturnString(opReturnStr: string): string[] | null {
  if (!opReturnStr || typeof opReturnStr !== "string") {
    return null
  }

  // Split by pipe delimiter
  const parts = opReturnStr.split("|").map((p) => p.trim())

  // Must have exactly 14 fields
  if (parts.length !== 14) {
    console.log(`[OPRETURN-PARSER] Invalid field count: expected 14, got ${parts.length}`)
    return null
  }

  return parts
}

// ============================================================================
// Main Public Parser
// ============================================================================

/**
 * Parse and validate nTangleMint OP_RETURN data from a transaction
 *
 * Usage:
 *   const result = parseNTangleMintOpReturn(tx)
 *   if (result.valid) {
 *     // result.fields is the 15-field array
 *     // result.transactionType is the transaction type (Create, nTangle, etc)
 *   } else {
 *     // result.errors contains validation errors
 *   }
 *
 * @param tx - WhatsOnChain transaction object
 * @returns ParsedOpReturn with validation results
 */
export function parseNTangleMintOpReturn(tx: WhatsOnChainTx): ParsedOpReturn {
  if (!tx || !tx.vout) {
    return { valid: false, errors: ["Transaction missing vout data"] }
  }

  // Step 1: Extract OP_RETURN data from vout (from parts[0] or hex)
  const opReturnData = extractOpReturnData(tx.vout)
  if (!opReturnData) {
    return { valid: false, errors: ["No OP_RETURN data found in vout"] }
  }

  // Step 2: Decode to string (URL-decode or hex-decode)
  const opReturnStr = decodeOpReturnString(opReturnData)
  if (!opReturnStr) {
    return {
      valid: false,
      errors: ["Failed to decode OP_RETURN data"],
      raw: opReturnData,
    }
  }

  // Step 3: Check for nTangleMint marker
  if (!opReturnStr.includes("nTangleMint")) {
    return {
      valid: false,
      errors: ["OP_RETURN does not contain nTangleMint marker"],
      raw: opReturnStr,
    }
  }

  // Step 4: Parse into 14-field array
  const fields = parseOpReturnString(opReturnStr)
  if (!fields) {
    return {
      valid: false,
      errors: ["Failed to parse OP_RETURN into 14-field array"],
      raw: opReturnStr,
    }
  }

  // Step 5: Validate using type-aware validator router (routes to Core + Type-Specific validators)
  const validationResult = validateOpReturn(fields)

  return {
    valid: validationResult.valid,
    fields: validationResult.valid ? fields : undefined,
    transactionType: validationResult.transactionType,
    errors: validationResult.errors,
    raw: opReturnStr,
  }
}

/**
 * Helper: Get transaction type from parsed fields
 * @param fields - 14-field array from parseNTangleMintOpReturn
 * @returns Transaction type string or null
 */
export function getTransactionType(fields: string[] | undefined): string | null {
  if (!fields || fields.length < 3) {
    return null
  }

  const transactionType = fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE]
  const validTypes = Object.values(TRANSACTION_TYPES_OP_RETURN)

  return validTypes.includes(transactionType as any) ? transactionType : null
}

/**
 * Helper: Get program ID from parsed fields
 * @param fields - 14-field array from parseNTangleMintOpReturn
 * @returns Program ID string or null
 */
export function getProgramID(fields: string[] | undefined): string | null {
  if (!fields || fields.length < 4) {
    return null
  }

  return fields[CORE_FIELD_POSITIONS.PROGRAM_ID] || null
}

/**
 * Helper: Extract all relevant data from parsed fields into structured object
 * @param fields - 14-field array from parseNTangleMintOpReturn
 * @returns Structured object with all parsed fields
 */
export function extractFieldsData(fields: string[] | undefined) {
  if (!fields || fields.length < 14) {
    return null
  }

  return {
    protocol: fields[CORE_FIELD_POSITIONS.PROTOCOL],
    programType: fields[CORE_FIELD_POSITIONS.PROGRAM_TYPE],
    transactionType: fields[CORE_FIELD_POSITIONS.TRANSACTION_TYPE],
    programID: fields[CORE_FIELD_POSITIONS.PROGRAM_ID],
    programName: fields[CORE_FIELD_POSITIONS.PROGRAM_NAME],
    // Fields 5-8 vary by transaction type (program-type-specific)
    field5: fields[5], // requiredPunches (PunchCard Create) | will vary for other types
    field6: fields[6], // expirationDays (PunchCard Create)
    field7: fields[7], // reward (PunchCard Create)
    field8: fields[8], // satoshisPerPunch (PunchCard Create)
    // Fields 9-13 are reserved
  }
}