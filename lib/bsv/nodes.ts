"use client"

import type { TransactionConfig } from "./types"
import { DEFAULT_CONFIG } from "./config"

export async function broadcastTransaction(transaction: any, config?: TransactionConfig) {
  try {
    const response = await fetch(`${DEFAULT_CONFIG.apiEndpoint}/tx/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawtx: transaction.toString(),
        ...config,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to broadcast transaction")
    }

    const data = await response.json()
    return data.txid
  } catch (error) {
    console.error("Error broadcasting transaction:", error)
    throw error
  }
}

export async function fetchUTXOs(address: string) {
  try {
    const response = await fetch(`${DEFAULT_CONFIG.apiEndpoint}/address/${address}/utxo`)
    if (!response.ok) {
      throw new Error("Failed to fetch UTXOs")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching UTXOs:", error)
    throw error
  }
}

export async function getAddressBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${DEFAULT_CONFIG.apiEndpoint}/address/${address}/balance`)
    if (!response.ok) {
      throw new Error("Failed to fetch balance")
    }
    const data = await response.json()
    return data.balance
  } catch (error) {
    console.error("Error fetching balance:", error)
    throw error
  }
}