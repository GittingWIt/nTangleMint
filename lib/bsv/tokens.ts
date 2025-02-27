"use client"

import { broadcastTransaction, fetchUTXOs } from "./nodes"
import type { TokenMintParams } from "./types"

export async function mintBSV20Token({ address, privateKey, symbol, amount }: TokenMintParams): Promise<string> {
  try {
    const utxos = await fetchUTXOs(address)

    // Construct the token mint script
    const script = ["BSV20", "MINT", symbol, amount.toString()]

    // Create and broadcast the transaction
    const txid = await broadcastTransaction({
      script,
      utxos,
      address,
      privateKey,
    })

    return txid
  } catch (error) {
    console.error("Error minting BSV20 token:", error)
    throw error
  }
}

export async function transferBSV20Token(
  fromAddress: string,
  toAddress: string,
  privateKey: string,
  tokenId: string,
  amount: number,
): Promise<string> {
  try {
    const utxos = await fetchUTXOs(fromAddress)

    // Create and broadcast the transfer transaction
    const txid = await broadcastTransaction({
      type: "transfer",
      tokenId,
      amount,
      fromAddress,
      toAddress,
      privateKey,
      utxos,
    })

    return txid
  } catch (error) {
    console.error("Error transferring BSV20 token:", error)
    throw error
  }
}