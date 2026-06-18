/**
 * Trade Block Service
 *
 * Handles marketplace operations for punch cards:
 * - List/delist cards for sale
 * - Query active listings
 * - Determine card ownership and listing status
 */

import { OpReturnData } from "./transactions"

export interface CardListing {
  cardId: string
  programId: string
  programName: string
  listingPrice: number
  listedBy: string
  listedAtTime: number
  txId: string
  status: "active" | "delisted" | "sold"
}

export interface CardOwnershipInfo {
  cardId: string
  currentOwner: string
  lastTradeTime?: number
  listingStatus: "not_listed" | "listed" | "sold"
  listingPrice?: number
}

/**
 * Transaction type interface for marketplace operations
 */
export interface MarketplaceTransaction {
  txId: string
  timestamp: number
  type: "nList" | "dList" | "nTrade"
  cardId: string
  programId: string
  programName: string
  listedBy?: string
  listingPrice?: number
  salePrice?: number
  buyer?: string
  seller?: string
}

/**
 * Build nList OP_RETURN transaction data
 * Lists a punch card for sale on the marketplace
 */
export function buildNListOPReturn(params: {
  programId: string
  programName: string
  cardId: string
  listingPrice: number
}): OpReturnData {
  const { programId, programName, cardId, listingPrice } = params

  return {
    data: [
      "nTangleMint",
      "PunchCard",
      "nList",
      programId,
      programName,
      cardId,
      listingPrice.toString(),
    ],
  }
}

/**
 * Build dList OP_RETURN transaction data
 * Removes a punch card from the marketplace
 */
export function buildDListOPReturn(params: {
  programId: string
  programName: string
  cardId: string
}): OpReturnData {
  const { programId, programName, cardId } = params

  return {
    data: [
      "nTangleMint",
      "PunchCard",
      "dList",
      programId,
      programName,
      cardId,
    ],
  }
}

/**
 * Build nTrade OP_RETURN transaction data
 * Records the purchase and ownership transfer of a punch card
 */
export function buildNTradeOPReturn(params: {
  programId: string
  programName: string
  cardId: string
  salePrice: number
}): OpReturnData {
  const { programId, programName, cardId, salePrice } = params

  return {
    data: [
      "nTangleMint",
      "PunchCard",
      "nTrade",
      programId,
      programName,
      cardId,
      salePrice.toString(),
    ],
  }
}

/**
 * Determine current owner of a punch card
 * by analyzing the chain of nTrade transactions
 *
 * Logic:
 * - If nTrade transactions exist for this card, the most recent signer is the current owner
 * - If no nTrade exists, the first nTangle signer is the current owner
 */
export async function getCurrentCardOwner(
  cardId: string,
  transactions: Array<any>
): Promise<string | null> {
  // Filter all nTrade transactions for this card, sorted by timestamp descending
  const tradeTransactions = transactions
    .filter(
      tx =>
        tx.type === "nTrade" &&
        (tx.cardId === cardId || tx.fields?.[5] === cardId)
    )
    .sort((a, b) => b.timestamp - a.timestamp)

  if (tradeTransactions.length > 0) {
    // Most recent nTrade's signer is the current owner
    // In a real BSV tx, this would be derived from the input signature
    // For now, we need to get this from the transaction details
    return tradeTransactions[0].signer || null
  }

  // If no trades, find the first nTangle to get original creator
  const firstPunch = transactions.find(
    tx =>
      tx.type === "nTangle" &&
      (tx.cardId === cardId || tx.fields?.[5] === cardId)
  )

  return firstPunch?.signer || null
}

/**
 * Get listing status of a punch card
 *
 * Returns:
 * - "not_listed": Card exists but has no active listing
 * - "listed": Card has active nList (no subsequent dList or nTrade)
 * - "sold": Card has been traded (nTrade after nList) or delisted
 */
export function getCardListingStatus(
  cardId: string,
  transactions: Array<any>
): {
  status: "not_listed" | "listed" | "sold"
  listingPrice?: number
  listingTxId?: string
} {
  // Get all listing-related transactions for this card, sorted by timestamp descending
  const cardTransactions = transactions
    .filter(
      tx =>
        ["nList", "dList", "nTrade"].includes(tx.type) &&
        (tx.cardId === cardId || tx.fields?.[5] === cardId)
    )
    .sort((a, b) => b.timestamp - a.timestamp)

  if (cardTransactions.length === 0) {
    return { status: "not_listed" }
  }

  // Check most recent transaction
  const mostRecent = cardTransactions[0]

  if (mostRecent.type === "nTrade") {
    // Card was traded/sold
    return { status: "sold" }
  }

  if (mostRecent.type === "dList") {
    // Card was delisted
    return { status: "not_listed" }
  }

  if (mostRecent.type === "nList") {
    // Card is actively listed
    return {
      status: "listed",
      listingPrice: mostRecent.listingPrice || mostRecent.fields?.[6],
      listingTxId: mostRecent.txId,
    }
  }

  return { status: "not_listed" }
}

/**
 * Get all active listings on the Trade Block
 *
 * Returns cards that:
 * - Have an nList transaction
 * - Do NOT have a subsequent dList or nTrade
 */
export function getActiveListings(transactions: Array<any>): CardListing[] {
  const listings: CardListing[] = []
  const seenCards = new Set<string>()

  // Get all list-related transactions, sorted by timestamp descending
  const allListTransactions = transactions
    .filter(tx => ["nList", "dList", "nTrade"].includes(tx.type))
    .sort((a, b) => b.timestamp - a.timestamp)

  for (const tx of allListTransactions) {
    const cardId = tx.cardId || tx.fields?.[5]

    if (!cardId || seenCards.has(cardId)) {
      // Already processed this card
      continue
    }

    if (tx.type === "nList") {
      // This is an active listing
      seenCards.add(cardId)
      listings.push({
        cardId,
        programId: tx.programId || tx.fields?.[3],
        programName: tx.programName || tx.fields?.[4],
        listingPrice: tx.listingPrice || parseInt(tx.fields?.[6] || "0"),
        listedBy: tx.signer || "",
        listedAtTime: tx.timestamp,
        txId: tx.txId,
        status: "active",
      })
    } else if (tx.type === "dList" || tx.type === "nTrade") {
      // Card is no longer actively listed
      seenCards.add(cardId)
    }
  }

  return listings
}

/**
 * Get market statistics for the Trade Block
 */
export function getMarketStats(transactions: Array<any>) {
  const listings = getActiveListings(transactions)
  const tradeTransactions = transactions.filter(tx => tx.type === "nTrade")

  const prices = listings.map(l => l.listingPrice)
  const avgPrice = prices.length > 0 ? Math.floor(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0

  // Volume in last 24 hours
  const now = Math.floor(Date.now() / 1000)
  const dayAgo = now - 86400
  const tradedLast24h = tradeTransactions.filter(tx => tx.timestamp >= dayAgo)

  return {
    totalListings: listings.length,
    avgPrice,
    minPrice,
    maxPrice,
    volume24h: tradedLast24h.length,
    totalVolume24h: tradedLast24h.reduce((sum, tx) => sum + (tx.salePrice || 0), 0),
  }
}

/**
 * Check if a card is eligible to be listed
 * (exists in transaction history and is not already listed)
 */
export function isCardEligibleForListing(
  cardId: string,
  transactions: Array<any>
): boolean {
  // Card must have at least one nTangle (exists)
  const hasCard = transactions.some(
    tx =>
      tx.type === "nTangle" &&
      (tx.cardId === cardId || tx.fields?.[5] === cardId)
  )

  if (!hasCard) {
    return false
  }

  // Card must not be currently listed or traded
  const status = getCardListingStatus(cardId, transactions)
  return status.status === "not_listed"
}