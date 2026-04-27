/**
 * BSV/USD Conversion Utility
 * Provides functions to convert between BSV (satoshis) and USD
 * Uses a hardcoded exchange rate for MVP testing (can be replaced with real rates later)
 */

// Hardcoded exchange rate for testnet MVP
// 1 BSV = $0.10 USD (can be updated as needed)
const BSV_TO_USD_RATE = 0.1

// 1 BSV = 100,000,000 satoshis
const SATOSHIS_PER_BSV = 100_000_000

/**
 * Convert satoshis to BSV
 */
export function satoshisToBsv(satoshis: number): number {
  return satoshis / SATOSHIS_PER_BSV
}

/**
 * Convert BSV to satoshis
 */
export function bsvToSatoshis(bsv: number): number {
  return Math.round(bsv * SATOSHIS_PER_BSV)
}

/**
 * Convert satoshis to USD
 */
export function satoshisToUsd(satoshis: number): number {
  const bsv = satoshisToBsv(satoshis)
  return parseFloat((bsv * BSV_TO_USD_RATE).toFixed(2))
}

/**
 * Convert USD to satoshis
 */
export function usdToSatoshis(usd: number): number {
  const bsv = usd / BSV_TO_USD_RATE
  return bsvToSatoshis(bsv)
}

/**
 * Convert satoshis to BSV with specified decimal places
 */
export function formatBsv(satoshis: number, decimals: number = 8): string {
  const bsv = satoshisToBsv(satoshis)
  return bsv.toFixed(decimals)
}

/**
 * Convert satoshis to USD with formatting
 */
export function formatUsd(satoshis: number): string {
  const usd = satoshisToUsd(satoshis)
  return `$${usd.toFixed(2)}`
}

/**
 * Get current BSV to USD exchange rate
 */
export function getBsvUsdRate(): number {
  return BSV_TO_USD_RATE
}

/**
 * Update the BSV to USD exchange rate (for testing or real-time updates)
 */
export function setBsvUsdRate(newRate: number): void {
  if (newRate <= 0) {
    throw new Error("Exchange rate must be greater than 0")
  }
  // Note: In production, this would be replaced with API calls
  console.log("[v0] BSV/USD exchange rate updated to:", newRate)
}

/**
 * Display price in both satoshis and USD for UI
 */
export function formatPriceDisplay(satoshis: number): {
  satoshis: string
  bsv: string
  usd: string
} {
  return {
    satoshis: satoshis.toLocaleString(),
    bsv: formatBsv(satoshis, 8),
    usd: formatUsd(satoshis),
  }
}