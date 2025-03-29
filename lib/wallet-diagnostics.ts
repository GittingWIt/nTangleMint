// This file contains diagnostic functions to help troubleshoot wallet issues

export interface DiagnosticResult {
  environment: "local" | "production" | "unknown"
  config: {
    storagePrefix: string | null
    networkMode: string | null
    programVersion: string | null
    defaultMerchant: string | null
    resetStorage: string | null
    walletSalt: string | null
  }
  storage: {
    walletExists: boolean
    walletType: string | null
    walletAddress: string | null
    programsCount: number
    storageKeys: string[]
  }
  timestamp: string
}

export function runWalletDiagnostics(): DiagnosticResult {
  // Determine environment
  const hostname = window.location.hostname
  const environment =
    hostname.includes("localhost") || hostname.includes("127.0.0.1")
      ? "local"
      : hostname.includes("vercel.app")
        ? "production"
        : "unknown"

  // Get environment variables
  const config = {
    storagePrefix: process.env.NEXT_PUBLIC_STORAGE_PREFIX || null,
    networkMode: process.env.NEXT_PUBLIC_NETWORK_MODE || null,
    programVersion: process.env.NEXT_PUBLIC_PROGRAM_VERSION || null,
    defaultMerchant: process.env.NEXT_PUBLIC_DEFAULT_MERCHANT || null,
    resetStorage: process.env.NEXT_PUBLIC_RESET_STORAGE || null,
    walletSalt: process.env.NEXT_PUBLIC_WALLET_SALT
      ? `${process.env.NEXT_PUBLIC_WALLET_SALT.substring(0, 8)}...` // Only show first 8 chars for security
      : null,
  }

  // Check storage
  const prefix = config.storagePrefix || "ntanglemint_prod_"
  const walletKey = `${prefix}_wallet`
  const programsKey = `${prefix}_programs`

  const walletData = localStorage.getItem(walletKey)
  const programsData = localStorage.getItem(programsKey)

  // Get all storage keys with our prefix
  const storageKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      storageKeys.push(key)
    }
  }

  // Parse wallet data if it exists
  let walletType = null
  let walletAddress = null

  if (walletData) {
    try {
      const wallet = JSON.parse(walletData)
      walletType = wallet.type || null
      walletAddress = wallet.publicAddress || null
    } catch (e) {
      console.error("Error parsing wallet data:", e)
    }
  }

  // Parse programs data if it exists
  let programsCount = 0
  if (programsData) {
    try {
      const programs = JSON.parse(programsData)
      programsCount = Array.isArray(programs) ? programs.length : 0
    } catch (e) {
      console.error("Error parsing programs data:", e)
    }
  }

  return {
    environment,
    config,
    storage: {
      walletExists: !!walletData,
      walletType,
      walletAddress,
      programsCount,
      storageKeys,
    },
    timestamp: new Date().toISOString(),
  }
}

// Function to log diagnostics to console in a readable format
export function logDiagnostics(diagnostics: DiagnosticResult) {
  console.log("=== nTangleMint Wallet Diagnostics ===")
  console.log(`Environment: ${diagnostics.environment}`)
  console.log(`Timestamp: ${diagnostics.timestamp}`)

  console.log("\nConfiguration:")
  console.table(diagnostics.config)

  console.log("\nStorage:")
  console.log(`Wallet Exists: ${diagnostics.storage.walletExists}`)
  console.log(`Wallet Type: ${diagnostics.storage.walletType}`)
  console.log(`Wallet Address: ${diagnostics.storage.walletAddress}`)
  console.log(`Programs Count: ${diagnostics.storage.programsCount}`)

  console.log("\nStorage Keys:")
  diagnostics.storage.storageKeys.forEach((key) => console.log(`- ${key}`))

  console.log("=== End Diagnostics ===")
}

// Function to compare diagnostics between environments
export function compareDiagnostics(local: DiagnosticResult, production: DiagnosticResult) {
  console.log("=== Environment Comparison ===")

  // Compare configuration
  console.log("\nConfiguration Differences:")
  const configDiffs = []

  for (const key in local.config) {
    if (local.config[key] !== production.config[key]) {
      configDiffs.push({
        key,
        local: local.config[key],
        production: production.config[key],
      })
    }
  }

  if (configDiffs.length === 0) {
    console.log("No configuration differences found.")
  } else {
    console.table(configDiffs)
  }

  // Compare wallet data
  console.log("\nWallet Differences:")
  if (
    local.storage.walletExists !== production.storage.walletExists ||
    local.storage.walletType !== production.storage.walletType ||
    local.storage.walletAddress !== production.storage.walletAddress
  ) {
    console.table({
      walletExists: { local: local.storage.walletExists, production: production.storage.walletExists },
      walletType: { local: local.storage.walletType, production: production.storage.walletType },
      walletAddress: { local: local.storage.walletAddress, production: production.storage.walletAddress },
    })
  } else {
    console.log("No wallet differences found.")
  }

  console.log("=== End Comparison ===")
}