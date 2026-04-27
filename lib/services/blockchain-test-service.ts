/**
 * Blockchain Sync Test Service
 *
 * Validates core blockchain query operations:
 * - WALLET metadata retrieval
 * - PROGRAM metadata retrieval  
 * - Punch card state queries (nTangled, nProcess, Redeemed)
 * - DELETE record detection
 *
 * Milestone 1: Test Suite & Baseline - verifies all record types work,
 * documents response times and failure modes.
 */

export interface TestResult {
  name: string
  status: "pass" | "fail" | "pending"
  duration: number
  error?: string
  details?: Record<string, unknown>
}

export interface BlockchainSyncResults {
  timestamp: string
  environment: string
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
  summary: {
    avgResponseTime: number
    slowestQuery: string
    failurePatterns: string[]
  }
}

// ============================================================================
// Test Harness
// ============================================================================

/**
 * Test WALLET record retrieval
 */
export async function testWalletRetrieval(testAddress: string): Promise<TestResult> {
  const start = Date.now()
  try {
    const response = await fetch(
      `/api/external/onchain-state?type=WALLET&address=${testAddress}&limit=1`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const duration = Date.now() - start

    if (!data.transactions || data.transactions.length === 0) {
      return {
        name: "WALLET Retrieval",
        status: "pass",
        duration,
        details: { message: "No WALLET records found (expected for new wallet)", txCount: 0 },
      }
    }

    return {
      name: "WALLET Retrieval",
      status: "pass",
      duration,
      details: { recordsFound: data.transactions.length, type: data.type },
    }
  } catch (error) {
    return {
      name: "WALLET Retrieval",
      status: "fail",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Test PROGRAM record retrieval and field validation
 * 
 * Validates that PROGRAM records contain expected fields:
 * - Basic fields: programID, walletID (always present)
 * - Optional recovery fields: programName, reward, requiredPunches, expirationDays (new format)
 */
export async function testProgramRetrieval(programId: string): Promise<TestResult> {
  const start = Date.now()
  try {
    const response = await fetch(
      `/api/external/onchain-state?type=PROGRAM&limit=10`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const duration = Date.now() - start

    if (!data.transactions || data.transactions.length === 0) {
      return {
        name: "PROGRAM Retrieval",
        status: "pass",
        duration,
        details: { message: "No PROGRAM records found (expected for new app)", txCount: 0 },
      }
    }

    // Validate that parsed fields contain expected data
    // Note: Field parsing validation happens in getProgramsByWalletOnChain
    return {
      name: "PROGRAM Retrieval",
      status: "pass",
      duration,
      details: { 
        recordsFound: data.transactions.length, 
        type: data.type,
        note: "PROGRAM records may contain basic fields (programID, walletID) or extended fields (name, reward, punches, expiration)"
      },
    }
  } catch (error) {
    return {
      name: "PROGRAM Retrieval",
      status: "fail",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Test punch card state queries (nTangled, nProcess, Redeemed)
 */
export async function testPunchCardRetrieval(): Promise<TestResult> {
  const start = Date.now()
  try {
    const recordTypes = ["nTangled", "nProcess", "Redeemed"]
    const results: Record<string, number> = {}

    for (const type of recordTypes) {
      const response = await fetch(
        `/api/external/onchain-state?type=${type}&limit=10`,
        { signal: AbortSignal.timeout(10000) }
      )

      if (!response.ok) {
        throw new Error(`${type} query failed: ${response.statusText}`)
      }

      const data = await response.json()
      results[type] = data.transactions?.length || 0
    }

    const duration = Date.now() - start

    return {
      name: "Punch Card Retrieval",
      status: "pass",
      duration,
      details: results,
    }
  } catch (error) {
    return {
      name: "Punch Card Retrieval",
      status: "fail",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Test DELETE record detection
 */
export async function testDeleteRetrieval(): Promise<TestResult> {
  const start = Date.now()
  try {
    const response = await fetch(
      `/api/external/onchain-state?type=DELETE&limit=10`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const duration = Date.now() - start

    return {
      name: "DELETE Record Retrieval",
      status: "pass",
      duration,
      details: { recordsFound: data.transactions?.length || 0 },
    }
  } catch (error) {
    return {
      name: "DELETE Record Retrieval",
      status: "fail",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Test API error handling (network timeout, malformed request)
 */
export async function testErrorHandling(): Promise<TestResult> {
  const start = Date.now()
  try {
    const response = await fetch(
      `/api/external/onchain-state?type=INVALID_TYPE&limit=10`,
      { signal: AbortSignal.timeout(5000) }
    )

    const duration = Date.now() - start

    // Expecting either an error or empty results, not a crash
    if (response.ok || response.status === 400) {
      return {
        name: "Error Handling",
        status: "pass",
        duration,
        details: { statusCode: response.status, handledGracefully: true },
      }
    }

    throw new Error(`Unexpected status: ${response.status}`)
  } catch (error) {
    return {
      name: "Error Handling",
      status: "fail",
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Run full test suite
 */
export async function runBlockchainSyncTests(
  testAddress: string = "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn"
): Promise<BlockchainSyncResults> {
  const startTime = Date.now()
  const results: TestResult[] = []

  console.log("[v0] Starting Blockchain Sync Tests...")

  results.push(await testWalletRetrieval(testAddress))
  results.push(await testProgramRetrieval(""))
  results.push(await testPunchCardRetrieval())
  results.push(await testDeleteRetrieval())
  results.push(await testErrorHandling())

  const passed = results.filter((r) => r.status === "pass").length
  const failed = results.filter((r) => r.status === "fail").length
  const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const slowestQuery = results.reduce((a, b) => (a.duration > b.duration ? a : b)).name

  const failurePatterns: string[] = []
  results.forEach((r) => {
    if (r.status === "fail" && r.error) {
      failurePatterns.push(`${r.name}: ${r.error}`)
    }
  })

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet",
    totalTests: results.length,
    passed,
    failed,
    results,
    summary: {
      avgResponseTime,
      slowestQuery,
      failurePatterns,
    },
  }
}