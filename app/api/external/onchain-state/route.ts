import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"

/**
 * GET /api/external/onchain-state
 *
 * Server-side route handler for querying nTangleMint OP_RETURN data from WhatsOnChain.
 * Bypasses CORS restrictions that would block client-side calls.
 *
 * Query parameters:
 *   type:    Record type to query (WALLET | PROGRAM | nTangled | nProcess | Redeemed | DELETE)
 *   address: BSV address (required for WALLET queries)
 *   limit:   Max transactions to fetch (default: 100)
 *
 * nTangleMint Format (extensible, no versioning):
 *   WALLET:   nTangleMint | WALLET | {walletID} | reserved...
 *   PROGRAM:  nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved...
 *   DELETE:   nTangleMint | DELETE | {programID} | {walletID} | reserved...
 *
 * Returns: { transactions: [], count: number, type: string, address?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "nTangled"
    const address = searchParams.get("address") // Required for WALLET queries
    const limit = parseInt(searchParams.get("limit") || "100")

    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl = networkMode === "mainnet" 
      ? "https://api.whatsonchain.com/v1/bsv/main"
      : "https://api.whatsonchain.com/v1/bsv/test"

    console.log(`[v0] Querying onchain state, type: ${type}, address: ${address}`)

    let results: any[] = []

    if ((type === "WALLET" || type === "PROGRAM") && address) {
      // For WALLET and PROGRAM queries, search the address's transaction history
      // WALLET:  nTangleMint | WALLET | {walletID} | reserved...
      // PROGRAM: nTangleMint | PROGRAM | {programID} | {walletID} | {programName} | {reward} | {requiredPunches} | {expirationDays} | reserved...
      console.log(`[v0] Fetching ${type} records for ${address}`)
      
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
            // Fetch full transaction details for each transaction
            // to parse OP_RETURN scripts
            const detailPromises = history.slice(0, Math.min(10, limit)).map(async (txInfo: any) => {
              try {
                const txUrl = `${apiUrl}/tx/hash/${txInfo.tx_hash}`
                const txResponse = await fetch(txUrl, {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                })
                
                if (txResponse.ok) {
                  return await txResponse.json()
                }
              } catch (err) {
                console.warn(`[v0] Failed to fetch tx ${txInfo.tx_hash}:`, err)
              }
              return null
            })

            const txDetails = await Promise.all(detailPromises)
            results = txDetails.filter(tx => tx !== null)
            
            console.log(`[v0] Found ${results.length} transactions for ${address}`)
          }
        } else {
          console.warn(`[v0] Address history query failed: ${historyResponse.status}`)
        }
      } catch (err) {
        console.error(`[v0] Error fetching address history:`, err)
        // If address history fails, fall back to script search
      }
    } else {
      // For nTangled/nProcess/Redeemed/PROGRAM/DELETE queries, search using script pattern
      // Note: WhatsOnChain script/search may be unreliable - results vary
      console.log(`[v0] Searching for nTangleMint ${type} transactions via script search`)
      
      try {
        const searchUrl = `${apiUrl}/script/search/nTangleMint`

        const searchResponse = await fetch(searchUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (searchResponse.ok) {
          const searchResults = await searchResponse.json()
          results = Array.isArray(searchResults) ? searchResults : []
          console.log(`[v0] Script search found ${results.length} results`)
        } else {
          console.warn(`[v0] Script search failed: ${searchResponse.status}`)
          // Return empty results for graceful degradation
          results = []
        }
      } catch (err) {
        console.error(`[v0] Script search error:`, err)
        // Graceful failure - return empty results
        results = []
      }
    }

    const successResponse = NextResponse.json({
      transactions: results,
      count: results.length,
      type: type,
      address: address || undefined
    })

    return withCORSHeaders(successResponse, request)
  } catch (error) {
    console.error("[v0] Onchain state route error:", error)
    const errorResponse = NextResponse.json(
      { error: "Failed to query onchain state", transactions: [], count: 0 },
      { status: 200 } // Return 200 with empty results for graceful degradation
    )
    return withCORSHeaders(errorResponse, request)
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export function OPTIONS(request: NextRequest) {
  return handleCORSPreflight(request)
}