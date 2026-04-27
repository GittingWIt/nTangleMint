import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"

/**
 * GET /api/external/block-height
 * 
 * Public route handler for fetching current block height from WhatsOnChain
 * No strict CORS restrictions - read-only external query
 */
export async function GET(request: NextRequest) {
  try {
    const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet"
    const apiUrl = networkMode === "mainnet" 
      ? "https://api.whatsonchain.com/v1/bsv/main"
      : "https://api.whatsonchain.com/v1/bsv/test"

    const response = await fetch(`${apiUrl}/chain/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[API] WhatsOnChain block height error: ${response.status} ${response.statusText}`)
      const errorResponse = NextResponse.json(
        { error: "Failed to fetch block height", blockHeight: 0 },
        { status: 200 }
      )
      return withCORSHeaders(errorResponse, request)
    }

    const data = await response.json()

    const successResponse = NextResponse.json({
      blockHeight: data.blocks || 0,
      timestamp: data.timestamp || Date.now()
    })

    return withCORSHeaders(successResponse, request)
  } catch (error) {
    console.error("[API] Block height route error:", error)
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch block height", blockHeight: 0 },
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