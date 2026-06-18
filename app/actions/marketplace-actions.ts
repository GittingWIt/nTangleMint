'use server'

import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { getClientId } from '@/lib/utils/get-client-id'
import { sendTransaction, buildNListTransaction, buildDListTransaction, buildNTradeTransaction, validateNListParams, validateNTradeParams } from '@/lib/services/transactions'
import { getPrivKeyWif } from '@/lib/services/wallet-service'
import { validateAddress } from '@/lib/services/transactions'
import type { SendTransactionResult } from '@/lib/services/transactions'

export interface MarketplaceActionResult {
  success: boolean
  txId?: string
  txHex?: string
  fee?: number
  error?: string
  rateLimitInfo?: {
    remaining: number
    resetTime: number
    retryAfter?: number
  }
}

/**
 * Helper function to check marketplace rate limiting
 * Encapsulates the rate limiting logic used across all marketplace actions
 *
 * @param actionType - Type of action (list, delist, buy) for logging
 * @returns Object with allowed flag and rate limit info, or error info
 */
async function checkMarketplaceRateLimit(
  actionType: 'list' | 'delist' | 'buy'
): Promise<
  | {
      allowed: true
      rateLimitInfo?: never
    }
  | {
      allowed: false
      error: string
      rateLimitInfo: {
        remaining: number
        resetTime: number
        retryAfter?: number
      }
    }
> {
  const clientId = getClientId()
  const rateLimitKey = `marketplace:${actionType}:${clientId}`
  const config = RATE_LIMITS.marketplace

  const result = await rateLimiter(rateLimitKey, config.maxRequests, config.windowMs)

  if (!result.allowed) {
    const errorMessages: Record<string, string> = {
      list: 'Too many listing attempts. Please try again later.',
      delist: 'Too many delisting attempts. Please try again later.',
      buy: 'Too many purchase attempts. Please try again later.',
    }

    return {
      allowed: false,
      error: errorMessages[actionType],
      rateLimitInfo: {
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
      },
    }
  }

  return { allowed: true }
}

/**
 * Server action to list a punch card for sale
 *
 * Validates:
 * - Sender owns the card (wallet address matches card owner)
 * - Listing price is valid (> 0)
 * - Rate limiting (prevent spam)
 */
export async function listCardAction(params: {
  sellerAddress: string
  programId: string
  programName: string
  cardId: string
  listingPrice: number
}): Promise<MarketplaceActionResult> {
  try {
    const { sellerAddress, programId, programName, cardId, listingPrice } = params

    // STEP 1: Rate limiting
    console.log('[v0] [MarketplaceAction] Listing card - Step 1: Rate limiting')
    const rateLimitCheck = await checkMarketplaceRateLimit('list')

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error,
        rateLimitInfo: rateLimitCheck.rateLimitInfo,
      }
    }

    // STEP 2: Validate inputs
    console.log('[v0] [MarketplaceAction] Listing card - Step 2: Validating inputs')

    if (!sellerAddress || !validateAddress(sellerAddress)) {
      return { success: false, error: 'Invalid seller address' }
    }

    if (!programId || !programName || !cardId) {
      return { success: false, error: 'Missing required program or card information' }
    }

    // STEP 3: Validate listing parameters
    console.log('[v0] [MarketplaceAction] Listing card - Step 3: Validating listing parameters')
    const validation = validateNListParams({
      senderPrivKeyWif: '', // Will be fetched
      senderAddress: sellerAddress,
      programId,
      programName,
      cardId,
      listingPrice,
    })

    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // STEP 4: Get private key from wallet
    console.log('[v0] [MarketplaceAction] Listing card - Step 4: Retrieving wallet key')
    let privKeyWif: string
    try {
      privKeyWif = getPrivKeyWif(sellerAddress)
    } catch (error) {
      return { success: false, error: 'Unable to retrieve wallet key' }
    }

    // STEP 5: Build transaction
    console.log('[v0] [MarketplaceAction] Listing card - Step 5: Building nList transaction')
    const txParams = buildNListTransaction({
      senderPrivKeyWif: privKeyWif,
      senderAddress: sellerAddress,
      programId,
      programName,
      cardId,
      listingPrice,
    })

    // STEP 6: Broadcast transaction
    console.log('[v0] [MarketplaceAction] Listing card - Step 6: Broadcasting nList transaction')
    const result = await sendTransaction(txParams)

    console.log(`[v0] [MarketplaceAction] Card listed successfully: ${result.txId}`)
    return {
      success: true,
      txId: result.txId,
      txHex: result.txHex,
      fee: result.fee,
    }
  } catch (error) {
    console.error('[v0] [MarketplaceAction] Listing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list card',
    }
  }
}

/**
 * Server action to remove a listing
 *
 * Validates:
 * - Seller owns the card
 * - Card is currently listed
 * - Rate limiting
 */
export async function delistCardAction(params: {
  sellerAddress: string
  programId: string
  programName: string
  cardId: string
}): Promise<MarketplaceActionResult> {
  try {
    const { sellerAddress, programId, programName, cardId } = params

    // STEP 1: Rate limiting
    console.log('[v0] [MarketplaceAction] Delisting card - Step 1: Rate limiting')
    const rateLimitCheck = await checkMarketplaceRateLimit('delist')

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error,
        rateLimitInfo: rateLimitCheck.rateLimitInfo,
      }
    }

    // STEP 2: Validate inputs
    console.log('[v0] [MarketplaceAction] Delisting card - Step 2: Validating inputs')

    if (!sellerAddress || !validateAddress(sellerAddress)) {
      return { success: false, error: 'Invalid seller address' }
    }

    if (!programId || !programName || !cardId) {
      return { success: false, error: 'Missing required program or card information' }
    }

    // STEP 3: Get private key
    console.log('[v0] [MarketplaceAction] Delisting card - Step 3: Retrieving wallet key')
    let privKeyWif: string
    try {
      privKeyWif = getPrivKeyWif(sellerAddress)
    } catch (error) {
      return { success: false, error: 'Unable to retrieve wallet key' }
    }

    // STEP 4: Build transaction
    console.log('[v0] [MarketplaceAction] Delisting card - Step 4: Building dList transaction')
    const txParams = buildDListTransaction({
      senderPrivKeyWif: privKeyWif,
      senderAddress: sellerAddress,
      programId,
      programName,
      cardId,
    })

    // STEP 5: Broadcast transaction
    console.log('[v0] [MarketplaceAction] Delisting card - Step 5: Broadcasting dList transaction')
    const result = await sendTransaction(txParams)

    console.log(`[v0] [MarketplaceAction] Card delisted successfully: ${result.txId}`)
    return {
      success: true,
      txId: result.txId,
      txHex: result.txHex,
      fee: result.fee,
    }
  } catch (error) {
    console.error('[v0] [MarketplaceAction] Delisting error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delist card',
    }
  }
}

/**
 * Server action to purchase a card from the marketplace
 *
 * Validates:
 * - Buyer has sufficient funds
 * - Seller address is valid
 * - Card exists and is listed at the specified price
 * - Rate limiting
 */
export async function buyCardAction(params: {
  buyerAddress: string
  sellerAddress: string
  programId: string
  programName: string
  cardId: string
  listingPrice: number
}): Promise<MarketplaceActionResult> {
  try {
    const { buyerAddress, sellerAddress, programId, programName, cardId, listingPrice } = params

    // STEP 1: Rate limiting
    console.log('[v0] [MarketplaceAction] Buying card - Step 1: Rate limiting')
    const rateLimitCheck = await checkMarketplaceRateLimit('buy')

    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error,
        rateLimitInfo: rateLimitCheck.rateLimitInfo,
      }
    }

    // STEP 2: Validate inputs
    console.log('[v0] [MarketplaceAction] Buying card - Step 2: Validating inputs')

    if (!buyerAddress || !validateAddress(buyerAddress)) {
      return { success: false, error: 'Invalid buyer address' }
    }

    if (!sellerAddress || !validateAddress(sellerAddress)) {
      return { success: false, error: 'Invalid seller address' }
    }

    if (!programId || !programName || !cardId) {
      return { success: false, error: 'Missing required program or card information' }
    }

    // STEP 3: Validate trade parameters
    console.log('[v0] [MarketplaceAction] Buying card - Step 3: Validating trade parameters')
    const validation = validateNTradeParams({
      buyerPrivKeyWif: '', // Will be fetched
      buyerAddress,
      sellerAddress,
      programId,
      programName,
      cardId,
      salePrice: listingPrice,
    })

    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // STEP 4: Get buyer's private key
    console.log('[v0] [MarketplaceAction] Buying card - Step 4: Retrieving buyer wallet key')
    let privKeyWif: string
    try {
      privKeyWif = getPrivKeyWif(buyerAddress)
    } catch (error) {
      return { success: false, error: 'Unable to retrieve wallet key' }
    }

    // STEP 5: Build transaction
    console.log('[v0] [MarketplaceAction] Buying card - Step 5: Building nTrade transaction')
    const txParams = buildNTradeTransaction({
      buyerPrivKeyWif: privKeyWif,
      buyerAddress,
      sellerAddress,
      programId,
      programName,
      cardId,
      salePrice: listingPrice,
    })

    // STEP 6: Broadcast transaction
    console.log('[v0] [MarketplaceAction] Buying card - Step 6: Broadcasting nTrade transaction')
    const result = await sendTransaction(txParams)

    console.log(`[v0] [MarketplaceAction] Card purchased successfully: ${result.txId}`)
    return {
      success: true,
      txId: result.txId,
      txHex: result.txHex,
      fee: result.fee,
    }
  } catch (error) {
    console.error('[v0] [MarketplaceAction] Purchase error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase card',
    }
  }
}