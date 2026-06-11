import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"
import { parseNTangleMintOpReturn, getTransactionType, extractFieldsData } from "@/lib/utils/parsers/opreturn-parser"
import { parseProgramFromFields } from "@/lib/utils/parsers/program-parser-router"
import { CORE_FIELD_POSITIONS } from "@/lib/constants/core-field-positions"
import { PUNCHCARD_FIELD_POSITIONS } from "@/lib/constants/punchcard-field-positions"


/**
 * Parse Create transaction and extract program data from shared parser
 */
function parseCreateProgram(parseResult: any, tx: any): any {
  if (!parseResult.valid) return null
  
  // Only process Create transactions
  if (getTransactionType(parseResult.fields) !== "Create") return null

  try {
    const fields = parseResult.fields
    if (!fields || fields.length < 9) return null

    // Extract fields using new 14-field structure:
    // [0]=nTangleMint, [1]=ProgramType, [2]=TransactionType, [3]=programID, [4]=programName,
    // [5]=requiredPunches, [6]=expirationDays, [7]=rewardDescription, [8]=satoshisPerPunch
    const programId = fields[CORE_FIELD_POSITIONS.PROGRAM_ID]
    const programName = fields[CORE_FIELD_POSITIONS.PROGRAM_NAME]
    const requiredPunches = parseInt(fields[PUNCHCARD_FIELD_POSITIONS.REQUIRED_PUNCHES] || "0")
    const expirationDays = parseInt(fields[PUNCHCARD_FIELD_POSITIONS.EXPIRATION_DAYS] || "0")
    const reward = fields[PUNCHCARD_FIELD_POSITIONS.REWARD_DESCRIPTION] || ""

    return {
      id: programId,
      txId: tx.txid,
      name: programName,
      requiredPunches,
      expirationDays,
      reward,
      creatorAddress: tx.vout?.find((v: any) => v.scriptPubKey?.addresses)?.[0] || "unknown",
      status: expirationDays > 0 ? "active" : "expired",
      isExpired: expirationDays <= 0,
      blockHeight: tx.blockheight,
      timestamp: tx.time
    }
  } catch (err) {
    console.error(`[API-ONCHAIN-STATE] Failed to parse Create program:`, err)
    return null
  }
}

/**
 * Check if a program has a Delete transaction
 */
async function hasDeleteTransaction(programId: string, apiUrl: string): Promise<boolean> {
  try {
    // Query for Delete transactions with this programId
    // This is a simplified check - ideally we'd query blockchain index
    console.log(`[API-ONCHAIN-STATE] Checking for Delete transactions for program ${programId}`)
    // For now, return false (no delete found) - would need blockchain indexing for real implementation
    return false
  } catch (err) {
    console.error(`[API-ONCHAIN-STATE] Error checking Delete transactions:`, err)
    return false
  }
}

/**
 * GET /api/external/onchain-state
 *
 * Server-side route handler for querying nTangleMint OP_RETURN data from WhatsOnChain.
 * Bypasses CORS restrictions that would block client-side calls.
 *
 * Phase 5 Format (Broadcast Format):
 * Create:   nTangleMint | PunchCard | Create | {programID} | {BSV_TX_ID} | {programName} | {requiredPunches} | {expirationDays} | {reward} | ...
 * nTangle:  nTangleMint | PunchCard | nTangle | {customerAddress} | {programID} | ...
 * nProcess: nTangleMint | PunchCard | nProcess | {customerAddress} | {programID} | {punches} | ...
 * Redeem:   nTangleMint | PunchCard | Redeem | {customerAddress} | {programID} | ...
 * Delete:   nTangleMint | PunchCard | Delete | {programID} | {creatorAddress} | ...
 *
 * Query parameters:
 *   type:    Record type to query (Create | nTangle | nProcess | Redeem | Delete)
 *   address: BSV address (required for creator's programs)
 *   limit:   Max transactions to fetch (default: 100)
 *
 * Returns: { transactions: [], count: number, type: string, address?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "Create"
    const address = searchParams.get("address") // Creator's address for program lookups
    const limit = parseInt(searchParams.get("limit") || "100")

    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl = networkMode === "mainnet" 
      ? "https://api.whatsonchain.com/v1/bsv/main"
      : "https://api.whatsonchain.com/v1/bsv/test"

    console.log(`[API-ONCHAIN-STATE] Querying type: ${type}, address: ${address}`)

    let results: any[] = []

    if (address) {
      // For address-specific queries (Create programs by creator), fetch address history
      console.log(`[API-ONCHAIN-STATE] Fetching ${type} records for address ${address}`)
      
      try {
        const historyUrl = `${apiUrl}/address/${address}/history?limit=${Math.min(limit, 50)}`
        
        const historyResponse = await fetch(historyUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (historyResponse.ok) {
          const history = await historyResponse.json()
          
          if (Array.isArray(history) && history.length > 0) {
            console.log(`[API-ONCHAIN-STATE] Found ${history.length} transactions for address, fetching details...`)
            
            // Fetch full transaction details for each transaction
            const detailPromises: Promise<any> [] = history.slice(0, Math.min(10, limit)).map(async (txInfo: any) => {
              try {
                const txUrl = `${apiUrl}/tx/${txInfo.tx_hash}`
                const txResponse = await fetch(txUrl, {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                })
                
                if (txResponse.ok) {
                  return await txResponse.json()
                }
              } catch (err) {
                console.warn(`[API-ONCHAIN-STATE] Failed to fetch tx ${txInfo.tx_hash}:`, err)
              }
              return null
            })

            const txDetails = await Promise.all(detailPromises)
            results = txDetails.filter(tx => tx !== null)
            
            console.log(`[API-ONCHAIN-STATE] Retrieved ${results.length} transaction details`)
          }
        } else {
          console.warn(`[API-ONCHAIN-STATE] Address history query failed: ${historyResponse.status}`)
        }
      } catch (err) {
        console.error(`[API-ONCHAIN-STATE] Error fetching address history:`, err)
      }
    } else if (type === "CREATE") {
      // Global query for all CREATE transactions (for Browse Programs section)
      console.log(`[API-ONCHAIN-STATE] Querying all ${type} transactions globally...`)
      
      // Note: This requires a blockchain indexing service or a pre-computed list of all CREATE transactions.
      // For now, we return empty results as the foundational query pattern is not implemented.
      // In production, integrate with a service that indexes nTangleMint CREATE transactions.
      results = []
    } else {
      console.log(`[API-ONCHAIN-STATE] Query type ${type} requires an address parameter`)
    }

    const successResponse = NextResponse.json({
      transactions: results,
      count: results.length,
      type: type,
      address: address || undefined
    })

    return withCORSHeaders(successResponse, request)
  } catch (error) {
    console.error("[API-ONCHAIN-STATE] Route error:", error)
    const errorResponse = NextResponse.json(
      { error: "Failed to query onchain state", transactions: [], count: 0 },
      { status: 200 }
    )
    return withCORSHeaders(errorResponse, request)
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCORSPreflight(request)
}