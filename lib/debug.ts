/**
 * Debug utilities for BSV blockchain operations
 * Provides consistent logging across all BSV-related functions
 */

export interface DebugConfig {
  enabled: boolean
  logLevel: "info" | "warn" | "error" | "debug"
  modules: {
    "wallet-generation": boolean
    "wallet-validation": boolean
    "wallet-creation": boolean
    "wallet-restoration": boolean
    "bsv-wallet": boolean // ADD: Missing module for BSV wallet hook
    "program-loader": boolean
    "program-participation": boolean
    "wallet-detector": boolean
    "bsv-simulation": boolean
  }
}

// Debug configuration - can be controlled via environment variables
const debugConfig: DebugConfig = {
  enabled: process.env.NEXT_PUBLIC_DEBUG_MODE === "true" || process.env.NODE_ENV === "development",
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || "debug",
  modules: {
    "wallet-generation": true,
    "wallet-validation": true,
    "wallet-creation": true,
    "wallet-restoration": true,
    "bsv-wallet": true, // ADD: Enable BSV wallet debugging
    "program-loader": true,
    "program-participation": true,
    "wallet-detector": true,
    "bsv-simulation": true,
  },
}

/**
 * Debug logging function with module filtering
 */
export function debugLog(
  module: keyof DebugConfig["modules"],
  message: string,
  data?: any,
  level: "info" | "warn" | "error" | "debug" = "debug",
): void {
  if (!debugConfig.enabled || !debugConfig.modules[module]) {
    return
  }

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${module.toUpperCase()}]`

  switch (level) {
    case "error":
      console.error(`${prefix} ERROR:`, message, data ? data : "")
      break
    case "warn":
      console.warn(`${prefix} WARN:`, message, data ? data : "")
      break
    case "info":
      console.info(`${prefix} INFO:`, message, data ? data : "")
      break
    case "debug":
    default:
      console.log(`${prefix} DEBUG:`, message, data ? data : "")
      break
  }
}

/**
 * Simple debug function for basic logging (used by program-recovery.ts)
 */
export function debug(message: string, data?: any): void {
  if (debugConfig.enabled) {
    console.log(`[DEBUG] ${message}`, data ? data : "")
  }
}

/**
 * Performance timing utility for BSV operations
 */
export class PerformanceTimer {
  private startTime: number
  private module: string
  private operation: string

  constructor(module: string, operation: string) {
    this.module = module
    this.operation = operation
    this.startTime = performance.now()
    debugLog(module as keyof DebugConfig["modules"], `Starting operation: ${operation}`)
  }

  end(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    debugLog(this.module as keyof DebugConfig["modules"], `Completed operation: ${this.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
    })
    return duration
  }
}

/**
 * Format BSV transaction data for logging
 */
export function formatTransactionLog(txData: {
  txId?: string
  type: string
  from?: string
  to?: string
  amount?: number
  programId?: string
}): string {
  const parts = [
    `Type: ${txData.type}`,
    txData.txId ? `TxId: ${txData.txId}` : null,
    txData.from ? `From: ${txData.from.substring(0, 8)}...` : null,
    txData.to ? `To: ${txData.to.substring(0, 8)}...` : null,
    txData.amount ? `Amount: ${txData.amount}` : null,
    txData.programId ? `Program: ${txData.programId}` : null,
  ].filter(Boolean)

  return parts.join(" | ")
}

/**
 * Log BSV blockchain operation result
 */
export function logBSVOperation(
  module: keyof DebugConfig["modules"],
  operation: string,
  result: { success: boolean; message: string; txId?: string; data?: any },
): void {
  const level = result.success ? "info" : "error"
  const status = result.success ? "SUCCESS" : "FAILED"

  debugLog(
    module,
    `${operation} ${status}: ${result.message}`,
    {
      txId: result.txId,
      data: result.data,
    },
    level,
  )
}

/**
 * Enable/disable debug logging for specific modules
 */
export function setDebugModule(module: keyof DebugConfig["modules"], enabled: boolean): void {
  debugConfig.modules[module] = enabled
  debugLog(module, `Debug logging ${enabled ? "enabled" : "disabled"} for module: ${module}`)
}

/**
 * Get current debug configuration
 */
export function getDebugConfig(): DebugConfig {
  return { ...debugConfig }
}