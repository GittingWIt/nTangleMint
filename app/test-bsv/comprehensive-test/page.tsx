"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { runComprehensiveRestorationTest } from "../__tests__/test-wallet-restoration-comprehensive"

interface TestResultDisplay {
  success: boolean
  mnemonic: string
  results: Array<{
    success: boolean
    testCase: {
      description: string
      type: "user" | "merchant"
      password?: string
    }
    originalAddress?: string
    restoredAddress?: string
    error?: string
    debug?: {
      mnemonic: string
      mnemonicsMatch: boolean
      typesMatch: boolean
    }
  }>
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    storageConsistency: boolean
    addressConsistency: boolean
    addressUniqueness: boolean
    passwordEffectiveness: boolean
    typeEffectiveness: boolean
  }
  error?: string
}

export default function ComprehensiveTestPage() {
  const [result, setResult] = useState<TestResultDisplay | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const testResult = await runComprehensiveRestorationTest()
      setResult(testResult)
      if (!testResult.success) {
        setError("Some tests failed. Check the results for details.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Wallet Restoration Test</CardTitle>
          <CardDescription>Tests wallet restoration across different scenarios and configurations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runTest} disabled={isLoading}>
              {isLoading ? "Running Tests..." : "Run Comprehensive Test"}
            </Button>
            {result?.success && <Badge variant="success">All Tests Passed</Badge>}
            {error && <Badge variant="destructive">Tests Failed</Badge>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Test Summary</h3>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div>Mnemonic: {result.mnemonic}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <span>Total Tests:</span>
                    <span>{result.summary.totalTests}</span>
                    <span>Passed Tests:</span>
                    <span>{result.summary.passedTests}</span>
                    <span>Failed Tests:</span>
                    <span>{result.summary.failedTests}</span>
                  </div>
                  <div className="space-x-2">
                    <Badge variant={result.summary.storageConsistency ? "success" : "destructive"}>
                      Storage {result.summary.storageConsistency ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={result.summary.addressConsistency ? "success" : "destructive"}>
                      Address {result.summary.addressConsistency ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={result.summary.addressUniqueness ? "success" : "destructive"}>
                      Unique {result.summary.addressUniqueness ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={result.summary.passwordEffectiveness ? "success" : "destructive"}>
                      Password {result.summary.passwordEffectiveness ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={result.summary.typeEffectiveness ? "success" : "destructive"}>
                      Type {result.summary.typeEffectiveness ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Test Results</h3>
                {result.results.map((testResult, index) => (
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
                          {testResult.debug && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <p>Mnemonics Match: {testResult.debug.mnemonicsMatch ? "Yes" : "No"}</p>
                              <p>Types Match: {testResult.debug.typesMatch ? "Yes" : "No"}</p>
                            </div>
                          )}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}