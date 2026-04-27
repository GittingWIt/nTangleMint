/**
 * Network Configuration
 *
 * Toggle between testnet and mainnet.
 * Default to testnet for development.
 */

export type NetworkMode = "testnet" | "mainnet"

// Read from environment variable, default to testnet
export const NETWORK_MODE: NetworkMode = (process.env.NEXT_PUBLIC_NETWORK_MODE as NetworkMode) || "testnet"

/**
 * Get the current network mode
 */
export function getNetworkMode(): NetworkMode {
  return NETWORK_MODE
}

export const NETWORK_CONFIG = {
  testnet: {
    name: "BSV Testnet",
    explorerUrl: "https://test.whatsonchain.com",
    apiUrl: "https://api.whatsonchain.com/v1/bsv/test",
    faucetUrl: "https://faucet.bitcoincloud.net",
    // Average block time in milliseconds (10 minutes)
    avgBlockTimeMs: 10 * 60 * 1000,
  },
  mainnet: {
    name: "BSV Mainnet",
    explorerUrl: "https://whatsonchain.com",
    apiUrl: "https://api.whatsonchain.com/v1/bsv/main",
    faucetUrl: null, // No faucet for mainnet
    avgBlockTimeMs: 10 * 60 * 1000,
  },
} as const

// Export network configuration for convenience
export const network = NETWORK_CONFIG

export function getNetworkConfig() {
  return NETWORK_CONFIG[NETWORK_MODE]
}

export function getExplorerTxUrl(txId: string): string {
  const config = getNetworkConfig()
  return `${config.explorerUrl}/tx/${txId}`
}

export function getExplorerAddressUrl(address: string): string {
  const config = getNetworkConfig()
  return `${config.explorerUrl}/address/${address}`
}

// Estimate block height from date
export function estimateBlockHeightFromDate(currentBlockHeight: number, targetDate: Date): number {
  const config = getNetworkConfig()
  const now = Date.now()
  const targetTime = targetDate.getTime()
  const timeDiffMs = targetTime - now
  const blocksUntilTarget = Math.floor(timeDiffMs / config.avgBlockTimeMs)
  return currentBlockHeight + blocksUntilTarget
}

// Estimate date from block height
export function estimateDateFromBlockHeight(currentBlockHeight: number, targetBlockHeight: number): Date {
  const config = getNetworkConfig()
  const blocksDiff = targetBlockHeight - currentBlockHeight
  const timeDiffMs = blocksDiff * config.avgBlockTimeMs
  return new Date(Date.now() + timeDiffMs)
}