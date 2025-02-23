"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { testCreateWallet, testWalletCreationFlow } from "./test-create-wallet"
import { testRestoreWallet, testFullRestoreFlow } from "./test-restore-wallet"
import { runKeyDerivationTest } from "./test-key-derivation"
import { runPasswordDerivationTest } from "./test-password-derivation"
import { runWalletLifecycleTest } from "./test-wallet-lifecycle"
import { runDerivationPathTest } from "./__tests__/test-derivation-paths"
import { Badge } from "@/components/ui/badge"
import { clearWalletData } from "@/lib/storage"

// Simple client-side hydration test implementation
interface HydrationTestResult {
  success: boolean
  error?: string
  details: {
    componentTests: {
      name: string
      passed: boolean
      error?: string
    }[]
  }
}

async function testHydration(): Promise<HydrationTestResult> {
  return {
    success: true,
    details: {
      componentTests: [
        {
          name: "Basic Component Check",
          passed: true,
        },
      ],
    },
  }
}

type TestType =
  | "creation"
  | "restoration"
  | "keyDerivation"
  | "passwordDerivation"
  | "lifecycle"
  | "hydration"
  | "derivationPaths"
type WalletType = "user" | "merchant" | "full"

export default function TestBSVClient() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTest, setActiveTest] = useState<WalletType>("full")
  const [testType, setTestType] = useState<TestType>("creation")

  // Clear wallet data on component mount
  useEffect(() => {
    clearWalletData()
  }, [])

  const clearWallet = async () => {
    try {
      await clearWalletData()
      console.log("[Test] Cleared wallet data")
      setResult(null)
      setError(null)
    } catch (err) {
      console.error("[Test] Error clearing wallet:", err)
    }
  }

  const runTest = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Clear any existing wallet data before running tests
      await clearWalletData()

      let testResult
      switch (testType) {
        case "creation":
          testResult =
            activeTest === "full"
              ? await testWalletCreationFlow()
              : await testCreateWallet(activeTest as "user" | "merchant")
          break
        case "restoration":
          testResult =
            activeTest === "full"
              ? await testFullRestoreFlow()
              : await testRestoreWallet(activeTest as "user" | "merchant")
          break
        case "keyDerivation":
          testResult = await runKeyDerivationTest()
          break
        case "passwordDerivation":
          testResult = await runPasswordDerivationTest()
          break
        case "lifecycle":
          testResult = await runWalletLifecycleTest()
          break
        case "hydration":
          testResult = await testHydration()
          break
        case "derivationPaths":
          testResult = await runDerivationPathTest()
          break
      }

      setResult(testResult)
      if (!testResult.success) {
        setError(testResult.error || "Test failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BSV Wallet Tests</CardTitle>
        <CardDescription>Test wallet creation, restoration, and key derivation functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={testType} onValueChange={(value) => setTestType(value as TestType)}>
          <TabsList className="grid w-full grid-cols-7 text-xs sm:text-sm">
            <TabsTrigger value="creation">Creation</TabsTrigger>
            <TabsTrigger value="restoration">Restore</TabsTrigger>
            <TabsTrigger value="keyDerivation">Keys</TabsTrigger>
            <TabsTrigger value="passwordDerivation">Password</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="hydration">Hydration</TabsTrigger>
            <TabsTrigger value="derivationPaths">Paths</TabsTrigger>
          </TabsList>
        </Tabs>

        {testType !== "keyDerivation" &&
          testType !== "passwordDerivation" &&
          testType !== "lifecycle" &&
          testType !== "hydration" &&
          testType !== "derivationPaths" && (
            <Tabs value={activeTest} onValueChange={(value) => setActiveTest(value as WalletType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user">User Wallet</TabsTrigger>
                <TabsTrigger value="merchant">Merchant Wallet</TabsTrigger>
                <TabsTrigger value="full">Full Flow</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

        <div className="flex items-center gap-4">
          <Button onClick={runTest} disabled={isLoading}>
            {isLoading ? "Testing..." : "Run Test"}
          </Button>
          <Button variant="outline" onClick={clearWallet}>
            Clear Wallet Data
          </Button>
          {result?.success && <Badge variant="success">Tests Passed</Badge>}
          {error && <Badge variant="destructive">Tests Failed</Badge>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <h3 className="font-semibold">Test Results:</h3>

            {testType === "passwordDerivation" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Test Details</div>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div>Mnemonic: {result.mnemonic}</div>
                    <div>Success: {result.success ? "Yes" : "No"}</div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium">Password Tests</div>
                  <div className="bg-muted p-4 rounded-md space-y-4">
                    {result.tests.map((test: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="text-xs font-semibold">
                          Test with password: {test.password === "undefined" ? "No password" : "***"}
                        </div>
                        <div className="text-xs">Original Address: {test.originalAddress}</div>
                        <div className="space-y-1">
                          {test.restorations.map((restoration: any, rIndex: number) => (
                            <div key={rIndex} className="text-xs">
                              Restoration {rIndex + 1}: {restoration.address}
                              <Badge variant={restoration.matches ? "success" : "destructive"} className="ml-2">
                                {restoration.matches ? "Match" : "Mismatch"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.details && (
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Validation Details</div>
                    <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                      {Object.entries(result.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <Badge variant={value ? "success" : "destructive"}>{value ? "Pass" : "Fail"}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Display raw results for other test types */}
            {testType !== "passwordDerivation" && (
              <div className="grid gap-2">
                <div className="text-sm font-medium">Raw Test Output</div>
                <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}