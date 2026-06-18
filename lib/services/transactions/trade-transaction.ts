/**
 * Trade Transaction Builder
 *
 * Builds nList, dList, and nTrade transactions for the marketplace
 */

import { SendTransactionParams, TransactionOutput, OpReturnData } from "./core-transaction"

export interface BuildNListTransactionParams {
  senderPrivKeyWif: string
  senderAddress: string
  programId: string
  programName: string
  cardId: string
  listingPrice: number
}

export interface BuildDListTransactionParams {
  senderPrivKeyWif: string
  senderAddress: string
  programId: string
  programName: string
  cardId: string
}

export interface BuildNTradeTransactionParams {
  buyerPrivKeyWif: string
  buyerAddress: string
  sellerAddress: string
  programId: string
  programName: string
  cardId: string
  salePrice: number
}

/**
 * Build nList transaction (list card for sale)
 */
export function buildNListTransaction(
  params: BuildNListTransactionParams
): SendTransactionParams {
  const { senderPrivKeyWif, senderAddress, programId, programName, cardId, listingPrice } = params

  const opReturn: OpReturnData = {
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

  return {
    senderPrivKeyWif,
    senderAddress,
    outputs: [
      {
        address: senderAddress, // Change back to seller
        satoshis: 0, // Will be calculated as change
      },
    ],
    opReturn,
  }
}

/**
 * Build dList transaction (remove listing)
 */
export function buildDListTransaction(
  params: BuildDListTransactionParams
): SendTransactionParams {
  const { senderPrivKeyWif, senderAddress, programId, programName, cardId } = params

  const opReturn: OpReturnData = {
    data: [
      "nTangleMint",
      "PunchCard",
      "dList",
      programId,
      programName,
      cardId,
    ],
  }

  return {
    senderPrivKeyWif,
    senderAddress,
    outputs: [
      {
        address: senderAddress,
        satoshis: 0,
      },
    ],
    opReturn,
  }
}

/**
 * Build nTrade transaction (purchase card)
 *
 * The buyer broadcasts the transaction with:
 * - Output 1: Seller receives the sale price
 * - Output 2 (optional): Change back to buyer
 * - OP_RETURN: Transaction metadata
 *
 * In future Phase B.2 (with creator cut), we'd add:
 * - Output 3 (optional): Treasury receives platform fee
 * - Output 4 (optional): Creator receives incentive cut
 */
export function buildNTradeTransaction(
  params: BuildNTradeTransactionParams
): SendTransactionParams {
  const { buyerPrivKeyWif, buyerAddress, sellerAddress, programId, programName, cardId, salePrice } = params

  // Build outputs: seller gets the price, change comes back to buyer
  const outputs: TransactionOutput[] = [
    {
      address: sellerAddress,
      satoshis: salePrice,
    },
    {
      address: buyerAddress,
      satoshis: 0, // Change will be calculated automatically
    },
  ]

  const opReturn: OpReturnData = {
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

  return {
    senderPrivKeyWif: buyerPrivKeyWif,
    senderAddress: buyerAddress,
    outputs,
    opReturn,
  }
}

/**
 * Helper: Validate nTrade parameters before building
 */
export function validateNTradeParams(params: BuildNTradeTransactionParams): { valid: boolean; error?: string } {
  if (!params.sellerAddress || !params.buyerAddress) {
    return { valid: false, error: "Seller and buyer addresses required" }
  }

  if (params.sellerAddress === params.buyerAddress) {
    return { valid: false, error: "Cannot trade with yourself" }
  }

  if (params.salePrice <= 0) {
    return { valid: false, error: "Sale price must be greater than 0" }
  }

  return { valid: true }
}

/**
 * Helper: Validate nList parameters before building
 */
export function validateNListParams(params: BuildNListTransactionParams): { valid: boolean; error?: string } {
  if (params.listingPrice <= 0) {
    return { valid: false, error: "Listing price must be greater than 0" }
  }

  if (!params.cardId) {
    return { valid: false, error: "Card ID required" }
  }

  return { valid: true }
}