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
import { runWalletRestorationPathTest } from "./__tests__/test-wallet-restoration-paths"
import { runComprehensiveRestorationTest } from "./__tests__/test-wallet-restoration-comprehensive"
import { Badge } from "@/components/ui/badge"
import { clearWalletData } from "@/lib/storage"
import Link from "next/link"

type TestType =
  | "creation"
  | "restoration"
  | "keyDerivation"
  | "passwordDerivation"
  | "lifecycle"
  | "comprehensive"
  | "derivationPaths"
  | "restorationPaths"

type WalletType = "user" | "merchant" | "full"

function TestResults({ result, testType }: { result: any; testType: TestType }) {
  if (!result) return null

  if (testType === "comprehensive") {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Test Summary</div>
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div>Mnemonic: {result.mnemonic}</div>
            <div className="grid grid-cols-2 gap-2">
              <span>Total Tests:</span>
              <span>{result.summary.totalTests}</span>
              <span>Passed Tests:</span>
              <span>{result.summary.passedTests}</span>
              <span>Failed Tests:</span>
              <span>{result.summary.failedTests}</span>
              <span>Storage Consistency:</span>
              <Badge variant={result.summary.storageConsistency ? "success" : "destructive"}>
                {result.summary.storageConsistency ? "Pass" : "Fail"}
              </Badge>
              <span>Address Consistency:</span>
              <Badge variant={result.summary.addressConsistency ? "success" : "destructive"}>
                {result.summary.addressConsistency ? "Pass" : "Fail"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {result.results.map((testResult: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{testResult.testCase.description}</h4>
                    <Badge variant={testResult.success ? "success" : "destructive"}>
                      {testResult.success ? "Pass" : "Fail"}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Type: {testResult.testCase.type}</p>
                    <p>Password: {testResult.testCase.password ? "Yes" : "No"}</p>
                    <p className="font-mono text-xs break-all">Original: {testResult.originalAddress}</p>
                    <p className="font-mono text-xs break-all">Restored: {testResult.restoredAddress}</p>
                  </div>
                  {testResult.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResult.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Default test result display
  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">Test Output</div>
      <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}

export default function TestBSV() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTest, setActiveTest] = useState<WalletType>("full")
  const [testType, setTestType] = useState<TestType>("creation")

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
        case "comprehensive":
          testResult = await runComprehensiveRestorationTest()
          break
        case "derivationPaths":
          testResult = await runDerivationPathTest()
          break
        case "restorationPaths":
          testResult = await runWalletRestorationPathTest()
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

  const showWalletTypeTabs = ![
    "keyDerivation",
    "passwordDerivation",
    "lifecycle",
    "comprehensive",
    "derivationPaths",
    "restorationPaths",
  ].includes(testType)

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>BSV Wallet Tests</CardTitle>
          <CardDescription>Test wallet creation, restoration, and key derivation functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={testType} onValueChange={(value) => setTestType(value as TestType)}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 text-xs sm:text-sm">
              <TabsTrigger value="creation">Creation</TabsTrigger>
              <TabsTrigger value="restoration">Restore</TabsTrigger>
              <TabsTrigger value="keyDerivation">Keys</TabsTrigger>
              <TabsTrigger value="passwordDerivation">Password</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
              <TabsTrigger value="derivationPaths">Paths</TabsTrigger>
              <TabsTrigger value="restorationPaths">Restore+Paths</TabsTrigger>
            </TabsList>
          </Tabs>

          {showWalletTypeTabs && (
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

          {result && <TestResults result={result} testType={testType} />}

          <div className="flex justify-between items-center pt-4">
            <Link href="/test-bsv/lifecycle-test" passHref>
              <Button variant="outline">Run Lifecycle Test</Button>
            </Link>
            <Link href="/test-bsv/comprehensive-test" passHref>
              <Button variant="outline">Run Comprehensive Test</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}