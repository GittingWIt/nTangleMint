/**
 * BSV Service Layer
 *
 * Interfaces with the Rust BSV Library.
 * All blockchain operations go through this service.
 *
 * Currently configured for TESTNET - flip NETWORK_MODE to "mainnet" for production.
 */

import { NETWORK_MODE, getNetworkConfig } from "../config/network"

// Types for BSV operations
export interface UTXOData {
  txId: string
  outputIndex: number
  satoshis: number
  script: string
  sourceTransaction?: string // Full transaction hex for @bsv/sdk
}

export interface TransactionResult {
  txId: string
  rawHex: string
  fee: number
}

export interface BlockHeightInfo {
  height: number
  hash: string
  timestamp: Date
}

/**
 * Get current block height from the network
 * 
 * This calls the server-side /api/external/block-height route handler to bypass CORS restrictions.
 */
export async function getCurrentBlockHeight(): Promise<BlockHeightInfo> {
  try {
    // Call our Next.js route handler which proxies to WhatsOnChain (avoids CORS)
    const response = await fetch(`/api/external/block-height`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch block height: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      height: data.blockHeight || 0,
      hash: data.hash || "",
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("[BSV Service] Error fetching block height:", error)
    throw error
  }
}

/**
 * Get UTXOs for an address
 * 
 * This calls the server-side /api/external/utxos route handler to bypass CORS restrictions.
 */
export async function getUTXOs(address: string): Promise<UTXOData[]> {
  try {
    // Call our Next.js route handler which proxies to WhatsOnChain (avoids CORS)
    const url = `/api/external/utxos?address=${encodeURIComponent(address)}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[BSV Service] UTXO API error:", response.status, errorText)
      return []
    }

    const data = await response.json()
    
    // Route handler returns: { utxos, address, count }
    return data.utxos || []
  } catch (error) {
    console.error("[BSV Service] Error fetching UTXOs:", error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Get address balance
 * Returns 0 values if balance cannot be fetched (new wallet, network error, etc.)
 * 
 * This calls the server-side /api/external/balance route handler to bypass CORS restrictions.
 */
export async function getAddressBalance(address: string): Promise<{
  confirmed: number
  unconfirmed: number
  total: number
}> {
  try {
    // Call our Next.js route handler which proxies to WhatsOnChain (avoids CORS)
    const url = `/api/external/balance?address=${encodeURIComponent(address)}`
    console.log(`[v0] Fetching balance for address: ${address}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[BSV Service] API error:", response.status, errorText)
      // Return zero balance instead of throwing
      return {
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
      }
    }

    const data = await response.json()
    console.log(`[v0] Balance response: ${JSON.stringify(data)}`)
    
    // Route handler returns: { confirmed, unconfirmed, total, address }
    const confirmed = data.confirmed || 0
    const unconfirmed = data.unconfirmed || 0
    const total = data.total || (confirmed + unconfirmed)
    
    console.log(`[v0] Parsed balance - confirmed: ${confirmed}, unconfirmed: ${unconfirmed}, total: ${total}`)
    
    return {
      confirmed,
      unconfirmed,
      total,
    }
  } catch (error) {
    console.error("[BSV Service] Error fetching balance:", error instanceof Error ? error.message : error)
    // Return zero balance instead of throwing
    return {
      confirmed: 0,
      unconfirmed: 0,
      total: 0,
    }
  }
}

/**
 * Broadcast a transaction to the network
 */
export async function broadcastTransaction(rawHex: string): Promise<string> {
  const config = getNetworkConfig()

  try {
    const response = await fetch(`${config.apiUrl}/tx/raw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txhex: rawHex }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to broadcast transaction: ${errorText}`)
    }

    const txId = await response.text()
    console.log(`[BSV Service] Transaction broadcast successfully: ${txId}`)
    return txId.replace(/"/g, "") // Remove quotes if present
  } catch (error) {
    console.error("[BSV Service] Error broadcasting transaction:", error)
    throw error
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txId: string): Promise<any> {
  const config = getNetworkConfig()

  try {
    const response = await fetch(`${config.apiUrl}/tx/${txId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[BSV Service] Error fetching transaction:", error)
    throw error
  }
}

/**
 * Check if a transaction is confirmed
 */
export async function isTransactionConfirmed(txId: string): Promise<boolean> {
  try {
    const tx = await getTransaction(txId)
    return tx.confirmations > 0
  } catch {
    return false
  }
}

/**
 * Get the current network mode for display purposes
 */
export function getNetworkMode(): typeof NETWORK_MODE {
  return NETWORK_MODE
}

/**
 * Validate a BSV address
 */
export function isValidAddress(address: string): boolean {
  // Basic validation - real validation should use the Rust BSV library
  if (!address) return false

  // Testnet addresses start with 'm' or 'n' or '2'
  // Mainnet addresses start with '1' or '3'
  if (NETWORK_MODE === "testnet") {
    return /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)
  } else {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)
  }
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(txId: string): string {
  const config = getNetworkConfig()
  return `${config.explorerUrl}/tx/${txId}`
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  const config = getNetworkConfig()
  return `${config.explorerUrl}/address/${address}`
}

// Export network info for UI display
export const networkInfo = {
  mode: NETWORK_MODE,
  isTestnet: NETWORK_MODE === "testnet",
  isMainnet: NETWORK_MODE === "mainnet",
  config: getNetworkConfig(),
}