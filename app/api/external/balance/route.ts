import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"

/**
 * GET /api/external/balance
 * 
 * Public route handler for fetching wallet balance from WhatsOnChain
 * No strict CORS restrictions - read-only external query
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const startTime = Date.now()

    console.log(`[API-BALANCE] ========== REQUEST START ==========`)
    console.log(`[API-BALANCE] Timestamp: ${new Date().toISOString()}`)
    console.log(`[API-BALANCE] Address: ${address}`)
    console.log(`[API-BALANCE] Network Mode: ${process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"}`)

    if (!address) {
      console.error(`[API-BALANCE] ERROR: Missing address parameter`)
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      )
    }

    // Validate address format is reasonable
    if (typeof address !== "string" || address.length < 26 || address.length > 35) {
      console.error(`[API-BALANCE] ERROR: Invalid address format - length: ${address.length}`)
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      )
    }

    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl = networkMode === "mainnet" 
      ? "https://api.whatsonchain.com/v1/bsv/main"
      : "https://api.whatsonchain.com/v1/bsv/test"

    console.log(`[API-BALANCE] API Base URL: ${apiUrl}`)
    const utxoUrl = `${apiUrl}/address/${address}/unspent`
    console.log(`[API-BALANCE] Full UTXO URL: ${utxoUrl}`)

    // Query UTXOs instead of balance endpoint (balance endpoint has indexing issues)
    console.log(`[API-BALANCE] Fetching UTXOs from WhatsOnChain...`)
    const fetchStartTime = Date.now()
    
    const utxoResponse = await fetch(utxoUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const fetchDuration = Date.now() - fetchStartTime
    console.log(`[API-BALANCE] WhatsOnChain response received in ${fetchDuration}ms`)
    console.log(`[API-BALANCE] Response Status: ${utxoResponse.status} ${utxoResponse.statusText}`)
    console.log(`[API-BALANCE] Response Headers:`, {
      'content-type': utxoResponse.headers.get('content-type'),
      'content-length': utxoResponse.headers.get('content-length'),
    })

    if (!utxoResponse.ok) {
      console.error(`[API-BALANCE] ERROR: WhatsOnChain returned error status ${utxoResponse.status}`)
      const errorText = await utxoResponse.text()
      console.error(`[API-BALANCE] Error response body: ${errorText}`)
      
      const errorResponse = NextResponse.json(
        { 
          confirmed: 0,
          unconfirmed: 0,
          total: 0,
          address: address,
          error: `WhatsOnChain error: ${utxoResponse.status}`
        },
        { status: 200 }
      )
      return withCORSHeaders(errorResponse, request)
    }

    let utxos: any
    try {
      utxos = await utxoResponse.json()
      console.log(`[API-BALANCE] Response parsed successfully`)
      console.log(`[API-BALANCE] Response type: ${typeof utxos}`)
      console.log(`[API-BALANCE] Is Array: ${Array.isArray(utxos)}`)
      console.log(`[API-BALANCE] Response length/keys: ${Array.isArray(utxos) ? utxos.length : Object.keys(utxos).length}`)
      console.log(`[API-BALANCE] Full raw response:`, JSON.stringify(utxos, null, 2))
    } catch (parseError) {
      console.error(`[API-BALANCE] ERROR: Failed to parse JSON response:`, parseError)
      const responseText = await utxoResponse.text()
      console.error(`[API-BALANCE] Raw response text: ${responseText}`)
      
      const errorResponse = NextResponse.json(
        { 
          confirmed: 0,
          unconfirmed: 0,
          total: 0,
          address: address,
          error: "Failed to parse WhatsOnChain response"
        },
        { status: 200 }
      )
      return withCORSHeaders(errorResponse, request)
    }

    // Calculate balance from UTXOs manually
    console.log(`[API-BALANCE] ========== PROCESSING UTXOs ==========`)
    let totalSatoshis = 0
    let processedCount = 0
    let skippedCount = 0
    let duplicateCount = 0
    
    if (Array.isArray(utxos)) {
      console.log(`[API-BALANCE] Processing ${utxos.length} UTXOs`)
      
      // Deduplicate UTXOs by (txId, outputIndex) to handle WhatsOnChain returning duplicates
      const seenUtxos = new Map<string, any>()
      
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]
        const txId = utxo.tx_hash || utxo.txid || ''
        const outputIndex = utxo.tx_pos !== undefined ? utxo.tx_pos : utxo.vout !== undefined ? utxo.vout : -1
        const utxoKey = `${txId}:${outputIndex}`
        
        console.log(`[API-BALANCE] UTXO #${i}: key=${utxoKey}`)
        
        if (seenUtxos.has(utxoKey)) {
          console.log(`[API-BALANCE]   ⚠ DUPLICATE detected (already seen this output)`)
          duplicateCount++
          continue
        }
        
        seenUtxos.set(utxoKey, utxo)
        
        // Try multiple field names that WhatsOnChain might use
        const satoshis = utxo.value !== undefined ? utxo.value : 
                        utxo.satoshis !== undefined ? utxo.satoshis :
                        utxo.amount !== undefined ? utxo.amount : 0
        
        console.log(`[API-BALANCE]   - Satoshis: ${satoshis}`)
        console.log(`[API-BALANCE]   - TxID: ${txId}`)
        console.log(`[API-BALANCE]   - Output Index: ${outputIndex}`)
        
        if (satoshis && satoshis > 0) {
          totalSatoshis += satoshis
          processedCount++
          console.log(`[API-BALANCE]   ✓ Added to balance (total now: ${totalSatoshis})`)
        } else {
          skippedCount++
          console.log(`[API-BALANCE]   ✗ Skipped (invalid satoshis: ${satoshis})`)
        }
      }
      
      console.log(`[API-BALANCE] UTXO Processing Summary:`)
      console.log(`[API-BALANCE]   Total UTXOs returned: ${utxos.length}`)
      console.log(`[API-BALANCE]   Duplicates removed: ${duplicateCount}`)
      console.log(`[API-BALANCE]   Unique UTXOs processed: ${processedCount}`)
      console.log(`[API-BALANCE]   Skipped (invalid): ${skippedCount}`)
    } else {
      console.warn(`[API-BALANCE] WARNING: Response is not an array, type: ${typeof utxos}`)
      if (utxos && typeof utxos === 'object') {
        console.log(`[API-BALANCE] Object keys: ${Object.keys(utxos).join(', ')}`)
      }
    }

    console.log(`[API-BALANCE] ========== FINAL BALANCE ==========`)
    console.log(`[API-BALANCE] Total Satoshis: ${totalSatoshis}`)
    console.log(`[API-BALANCE] Total BSV: ${(totalSatoshis / 100_000_000).toFixed(8)}`)
    console.log(`[API-BALANCE] UTXO Count: ${Array.isArray(utxos) ? utxos.length : 0}`)

    const successResponse = NextResponse.json({
      confirmed: totalSatoshis,
      unconfirmed: 0,
      total: totalSatoshis,
      address: address,
      utxoCount: processedCount, // Unique UTXOs after deduplication
      bsv: (totalSatoshis / 100_000_000).toFixed(8),
      processingTime: `${Date.now() - startTime}ms`
    })

    console.log(`[API-BALANCE] ========== REQUEST COMPLETE ==========`)
    console.log(`[API-BALANCE] Total time: ${Date.now() - startTime}ms\n`)

    return withCORSHeaders(successResponse, request)
  } catch (error) {
    console.error(`[API-BALANCE] ========== CRITICAL ERROR ==========`)
    console.error(`[API-BALANCE] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    console.error(`[API-BALANCE] Error message: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`[API-BALANCE] Stack trace:`, error instanceof Error ? error.stack : 'N/A')
    console.error(`[API-BALANCE] ========== ERROR END ==========\n`)
    
    const errorResponse = NextResponse.json(
      { 
        error: "Failed to fetch balance",
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        errorDetails: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
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