import { NextRequest, NextResponse } from "next/server"
import { handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"
import { parseNTangleMintOpReturn, getTransactionType, getProgramID, extractFieldsData } from "@/lib/utils/parsers/opreturn-parser"
import { CORE_FIELD_POSITIONS } from "@/lib/constants/core-field-positions"
import { PUNCHCARD_FIELD_POSITIONS } from "@/lib/constants/punchcard-field-positions"

export async function OPTIONS(request: NextRequest) {
  return handleCORSPreflight(request)
}

interface Transaction {
  txId: string
  timestamp: number
  type: "Create" | "nTangle" | "nProcess" | "Redeem" | "Delete" | "nList" | "dList" | "nTrade"
  amount: number
  programName?: string
  programId?: string
  cardId?: string // Marketplace: card ID (Field 5 for marketplace txs)
  listingPrice?: number // nList: listing price (Field 6)
  salePrice?: number // nTrade: sale price (Field 6)
  status: "confirmed" | "pending"
  blockHeight?: number
}

/**
 * Calculate transaction amount
 * NOTE: WhatsOnChain coinbase transactions don't provide input values,
 * so we cannot reliably calculate fees from the transaction data alone.
 * For now, we return 0 and display transactions without fees.
 */
function calculateTransactionAmount(txHash: string, txData: any): number {
  // For these Create transactions (coinbase based), we don't have reliable input data
  // to calculate fees. Setting amount to 0.
  console.log(`[API-TRANSACTIONS] ${txHash} - coinbase transaction, setting amount=0`)
  return 0
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

    console.log(`[API-TRANSACTIONS] Fetching transactions for ${address} on ${networkMode}`)

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

    if (!Array.isArray(txHistory)) {
      console.warn(`[API-TRANSACTIONS] No transactions found`)
      return NextResponse.json({ transactions: [], address, count: 0 })
    }

    console.log(`[API-TRANSACTIONS] Processing ${txHistory.length} transactions from history`)

    // Process each transaction
    for (const tx of txHistory) {
      console.log(`[API-TRANSACTIONS][DEBUG] Processing tx: ${tx.tx_hash}`)
      
      // Fetch full transaction details
      const txDetailsUrl = `${apiUrl}/tx/${tx.tx_hash}`
      const txResponse = await fetch(txDetailsUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      })

      if (!txResponse.ok) {
        console.warn(`[API-TRANSACTIONS] Failed to fetch tx ${tx.tx_hash}: ${txResponse.status}`)
        continue
      }

      const txData = await txResponse.json()
      console.log(`[API-TRANSACTIONS][DEBUG] Fetched tx data, vout=${Array.isArray(txData.vout) ? txData.vout.length : 0}`)
      if (txData.vout && txData.vout[0]) {
        const vout0 = txData.vout[0]
        console.log(`[API-TRANSACTIONS][DEBUG] vout[0].scriptPubKey.opReturn type: ${typeof vout0.scriptPubKey?.opReturn}`)
        if (vout0.scriptPubKey?.opReturn) {
          console.log(`[API-TRANSACTIONS][DEBUG] opReturn.parts: ${Array.isArray(vout0.scriptPubKey.opReturn.parts) ? vout0.scriptPubKey.opReturn.parts.length + ' items' : 'not array'}`)
          if (Array.isArray(vout0.scriptPubKey.opReturn.parts) && vout0.scriptPubKey.opReturn.parts[0]) {
            const sample = vout0.scriptPubKey.opReturn.parts[0].substring(0, 100)
            console.log(`[API-TRANSACTIONS][DEBUG] parts[0] first 100 chars: "${sample}"`)
          }
        }
      }

      // Parse OP_RETURN data using shared parser
      const parseResult = parseNTangleMintOpReturn(txData)
      console.log(`[API-TRANSACTIONS][DEBUG] Parse result valid=${parseResult.valid}, transactionType=${parseResult.transactionType}`)
      if (!parseResult.valid && parseResult.errors) {
        console.log(`[API-TRANSACTIONS][DEBUG] Parse errors: ${JSON.stringify(parseResult.errors)}`)
      }
      
      if (!parseResult.valid) {
        console.log(`[API-TRANSACTIONS] ${tx.tx_hash} - not an nTangleMint transaction`)
        continue
      }

      // Extract fields from parsed result
      const programId = getProgramID(parseResult.fields)
      const transactionType = getTransactionType(parseResult.fields)
      const fieldsData = extractFieldsData(parseResult.fields)
      
      console.log(`[API-TRANSACTIONS][DEBUG] Extracted: programId=${programId}, type=${transactionType}, fieldsData=${fieldsData ? 'found' : 'not found'}`)
      
      if (!fieldsData) {
        console.error(`[API-TRANSACTIONS] ${tx.tx_hash} - failed to extract fields data`)
        continue
      }

      const programName = fieldsData.programName || "Unknown Program"
      console.log(`[API-TRANSACTIONS][DEBUG] programName=${programName}`)

      // Validate required fields
      if (!programName || !transactionType) {
        console.error(`[API-TRANSACTIONS] ${tx.tx_hash} - missing required parsed fields`)
        continue
      }

      // Calculate amount
      const amount = calculateTransactionAmount(tx.tx_hash, txData)

      // Extract marketplace-specific fields (Field 5 = cardId, Field 6 = price/amount)
      let cardId: string | undefined
      let listingPrice: number | undefined
      let salePrice: number | undefined

      if (["nList", "dList", "nTrade"].includes(transactionType)) {
        // Field 5 is cardId for marketplace transactions
        cardId = parseResult.fields?.[5]

        if (transactionType === "nList" && parseResult.fields?.[6]) {
          listingPrice = parseInt(parseResult.fields[6], 10)
        } else if (transactionType === "nTrade" && parseResult.fields?.[6]) {
          salePrice = parseInt(parseResult.fields[6], 10)
        }
      }

      // Create transaction record
      const transaction: Transaction = {
        txId: tx.tx_hash,
        timestamp: tx.time || Date.now() / 1000,
        type: transactionType as "Create" | "nTangle" | "nProcess" | "Redeem" | "Delete" | "nList" | "dList" | "nTrade",
        amount,
        programName,
        ...(programId && { programId }),
        ...(cardId && { cardId }),
        ...(listingPrice && { listingPrice }),
        ...(salePrice && { salePrice }),
        status: (tx.confirmations && tx.confirmations > 0) ? "confirmed" : "pending",
        blockHeight: tx.height
      }

      transactions.push(transaction)
      
      console.log(`[API-TRANSACTIONS] Added: ${tx.tx_hash}, type=${transaction.type}, program=${transaction.programName}, amount=${transaction.amount} sat`)
    }

    // Sort by timestamp descending (most recent first)
    transactions.sort((a, b) => b.timestamp - a.timestamp)

    console.log(`[API-TRANSACTIONS] Found ${transactions.length} valid nTangleMint format transactions`)

    const response = NextResponse.json({
      transactions,
      address,
      count: transactions.length
    })

    return withCORSHeaders(response, request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : ""
    console.error(`[API-TRANSACTIONS] FATAL ERROR: ${errorMessage}`)
    console.error(`[API-TRANSACTIONS] Stack: ${errorStack}`)
    
    const errorResponse = NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    )
    return withCORSHeaders(errorResponse, request)
  }
}