"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { generateMnemonic } from "@/lib/bsv/mnemonic"
import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { clearWalletData } from "@/lib/storage"

interface TestResult {
  success: boolean
  originalAddress: string
  restoredAddress: string
  error?: string
  debug?: {
    mnemonic: string
    originalType: "user" | "merchant"
    restoredType: "user" | "merchant"
  }
}

export default function SingleTestPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Clear any existing wallet data
      await clearWalletData()
      console.log("[Single Test] Cleared initial wallet data")

      // Generate mnemonic first
      const mnemonic = await generateMnemonic()
      console.log("[Single Test] Generated mnemonic:", mnemonic)

      // Create original wallet
      console.log("[Single Test] Creating original wallet")
      const originalWallet = await generateWallet(undefined, "user")
      console.log("[Single Test] Original wallet:", {
        address: originalWallet.publicAddress,
        type: originalWallet.type,
        mnemonic: originalWallet.mnemonic,
      })

      // Clear wallet data before restoration
      await clearWalletData()
      console.log("[Single Test] Cleared wallet data for restoration")

      // Restore wallet using the SAME mnemonic
      console.log("[Single Test] Restoring wallet with mnemonic:", originalWallet.mnemonic)
      const restoredWallet = await restoreWallet(originalWallet.mnemonic, undefined, "user")
      console.log("[Single Test] Restored wallet:", {
        address: restoredWallet.publicAddress,
        type: restoredWallet.type,
        mnemonic: restoredWallet.mnemonic,
      })

      const testResult: TestResult = {
        success: originalWallet.publicAddress === restoredWallet.publicAddress,
        originalAddress: originalWallet.publicAddress,
        restoredAddress: restoredWallet.publicAddress,
        debug: {
          mnemonic: originalWallet.mnemonic,
          originalType: originalWallet.type,
          restoredType: restoredWallet.type,
        },
      }

      setResult(testResult)

      if (!testResult.success) {
        console.error("[Single Test] Address mismatch:", {
          original: originalWallet.publicAddress,
          restored: restoredWallet.publicAddress,
          mnemonicMatch: originalWallet.mnemonic === restoredWallet.mnemonic,
          typeMatch: originalWallet.type === restoredWallet.type,
        })
        setError("Addresses do not match")
      }
    } catch (err) {
      console.error("[Single Test] Error:", err)
      setError(err instanceof Error ? err.message : "Test failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Single Wallet Restoration Test</CardTitle>
          <CardDescription>Tests wallet restoration for a user wallet without password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runTest} disabled={isLoading}>
              {isLoading ? "Running Test..." : "Run Single Test"}
            </Button>
            {result?.success && <Badge variant="success">Test Passed</Badge>}
            {error && <Badge variant="destructive">Test Failed</Badge>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-2">
              <h3 className="font-semibold">Test Result</h3>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div>Original Address: {result.originalAddress}</div>
                <div>Restored Address: {result.restoredAddress}</div>
                <div>Success: {result.success ? "Yes" : "No"}</div>
                {result.debug && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm font-medium mb-2">Debug Information</div>
                    <div className="text-xs font-mono break-all">
                      <div>Mnemonic: {result.debug.mnemonic}</div>
                      <div>Original Type: {result.debug.originalType}</div>
                      <div>Restored Type: {result.debug.restoredType}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}