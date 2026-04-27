import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"

/**
 * GET /api/external/utxos
 * 
 * Public route handler for fetching UTXOs from WhatsOnChain
 * Proxies UTXO requests to bypass browser CORS restrictions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      )
    }

    // Validate address format is reasonable
    if (typeof address !== "string" || address.length < 26 || address.length > 35) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      )
    }

    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl = networkMode === "mainnet" 
      ? "https://api.whatsonchain.com/v1/bsv/main"
      : "https://api.whatsonchain.com/v1/bsv/test"

    const response = await fetch(`${apiUrl}/address/${address}/unspent`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API] WhatsOnChain UTXO error: ${response.status} ${response.statusText}`, errorText)
      const errorResponse = NextResponse.json(
        { 
          utxos: [],
          error: `WhatsOnChain error: ${response.status} ${response.statusText}`
        },
        { status: 200 }
      )
      return withCORSHeaders(errorResponse, request)
    }

    const data = await response.json()
    
    console.log(`[API-UTXO] WhatsOnChain raw response for ${address}:`, JSON.stringify(data, null, 2))

    // Transform WhatsOnChain UTXO format to our format
    // Also fetch source transaction for each UTXO (required for @bsv/sdk)
    const utxos = Array.isArray(data) ? await Promise.all(data.map(async (utxo: any, index: number) => {
      console.log(`[API-UTXO] Processing UTXO #${index}:`, JSON.stringify(utxo))
      
      let sourceTransaction: string | undefined = undefined
      try {
        // Fetch the full transaction hex from WhatsOnChain
        const txResponse = await fetch(`${apiUrl}/tx/${utxo.tx_hash}/hex`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (txResponse.ok) {
          sourceTransaction = await txResponse.text()
          console.log(`[API-UTXO] Fetched source tx for ${utxo.tx_hash}: ${sourceTransaction.substring(0, 50)}...`)
        }
      } catch (err) {
        console.warn(`[API] Failed to fetch source transaction ${utxo.tx_hash}:`, err)
      }
      
      const transformed = {
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        satoshis: utxo.value,
        script: utxo.script || "",
        sourceTransaction,
      }
      console.log(`[API-UTXO] Transformed to:`, JSON.stringify(transformed))
      return transformed
    })) : []

    console.log(`[API-UTXO] Final UTXO count: ${utxos.length}`)
    console.log(`[API-UTXO] Final UTXOs:`, JSON.stringify(utxos, null, 2))

    const successResponse = NextResponse.json({
      utxos,
      address: address,
      count: utxos.length
    })

    return withCORSHeaders(successResponse, request)
  } catch (error) {
    console.error("[v0] UTXOs route error:", error)
    const errorResponse = NextResponse.json(
      { 
        error: "Failed to fetch UTXOs",
        utxos: []
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