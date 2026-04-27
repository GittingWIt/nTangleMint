import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"

export const OPTIONS = handleCORSPreflight

interface Transaction {
  txId: string
  timestamp: number
  type: "nTangled" | "nProcess" | "nRedeemed" | "faucet"
  amount: number
  programName?: string
  programId?: string
  status: "confirmed" | "pending"
  blockHeight?: number
}

/**
 * GET /api/external/transactions
 * 
 * Fetch transaction history from WhatsOnChain for a given address
 * Parses OP_RETURN data to identify nTangle transactions
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

    console.log(`[API-TRANSACTIONS] Fetching transactions for ${address}`)

    // Fetch transaction history from WhatsOnChain
    const txHistoryUrl = `${apiUrl}/address/${address}/history`
    const historyResponse = await fetch(txHistoryUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    })

    if (!historyResponse.ok) {
      console.error(`[API-TRANSACTIONS] WhatsOnChain error: ${historyResponse.status}`)
      return NextResponse.json(
        { error: "Failed to fetch transaction history" },
        { status: historyResponse.status }
      )
    }

    const txHistory = await historyResponse.json()
    const transactions: Transaction[] = []

    // Process each transaction
    if (Array.isArray(txHistory)) {
      for (const tx of txHistory) {
        console.log(`[API-TRANSACTIONS] Processing tx ${tx.tx_hash}`)
        
        // Fetch full transaction details to check OP_RETURN data
        const txDetailsUrl = `${apiUrl}/tx/${tx.tx_hash}`
        const txResponse = await fetch(txDetailsUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        })

        if (!txResponse.ok) {
          console.warn(`[API-TRANSACTIONS] Failed to fetch tx details for ${tx.tx_hash}`)
          continue
        }

        const txData = await txResponse.json()
        
        // Check if this is an nTangle transaction (has OP_RETURN with nTangleMint)
        if (txData.vout && Array.isArray(txData.vout)) {
          for (const output of txData.vout) {
            if (output.scriptPubKey?.opReturn) {
              const opReturn = output.scriptPubKey.opReturn
              
              // Check if this is an nTangle transaction
              if (opReturn.includes("nTangleMint")) {
                // Parse the OP_RETURN data
                const parts = opReturn.split("|")
                const txType = parts[1]?.trim() // nTangled, nProcess, nRedeemed
                const programId = parts[2]?.trim()
                
                // For now, get program name from the programId or use generic name
                let programName = "nTangle Program"
                if (programId) {
                  // Could look up program name from context
                  programName = `Program ${programId.substring(0, 8)}...`
                }
                
                // Calculate the amount from inputs/outputs
                let amount = 0
                if (txData.vin && Array.isArray(txData.vin)) {
                  amount = txData.vin.reduce((sum: number, input: any) => sum + (input.value || 0), 0)
                }

                console.log(`[API-TRANSACTIONS] nTangle tx ${tx.tx_hash} type: ${txType}, amount: ${amount}`)

                transactions.push({
                  txId: tx.tx_hash,
                  timestamp: tx.time || Date.now() / 1000,
                  type: (txType === "nTangled" || txType === "nProcess" || txType === "nRedeemed") ? txType : "faucet",
                  amount,
                  programName,
                  programId,
                  status: tx.confirmations && tx.confirmations > 0 ? "confirmed" : "pending",
                  blockHeight: tx.height
                })
              }
            }
          }
        }

        // If no OP_RETURN found, this is a faucet transaction
        if (transactions.find(t => t.txId === tx.tx_hash) === undefined) {
          let amount = 0
          // For faucet/funding transactions, sum all outputs (money coming in)
          if (txData.vout && Array.isArray(txData.vout)) {
            for (const output of txData.vout) {
              // Skip OP_RETURN outputs
              if (!output.scriptPubKey?.opReturn) {
                amount += output.value || 0
              }
            }
          }

          console.log(`[API-TRANSACTIONS] Faucet tx ${tx.tx_hash} amount: ${amount}`)

          transactions.push({
            txId: tx.tx_hash,
            timestamp: tx.time || Date.now() / 1000,
            type: "faucet",
            amount,
            status: tx.confirmations && tx.confirmations > 0 ? "confirmed" : "pending",
            blockHeight: tx.height
          })
        }
      }
    }

    // Sort by timestamp descending (most recent first)
    transactions.sort((a, b) => b.timestamp - a.timestamp)

    console.log(`[API-TRANSACTIONS] Found ${transactions.length} transactions`)

    const response = NextResponse.json({
      transactions,
      address,
      count: transactions.length
    })

    return withCORSHeaders(response, request)
  } catch (error) {
    console.error(`[API-TRANSACTIONS] Error:`, error)
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
    return withCORSHeaders(errorResponse, request)
  }
}