"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWalletData, setWalletData, clearWalletData, debugStorage } from "@/lib/storage"
import { mockMerchantWallet } from "@/lib/mock/wallet-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Bug, Beaker, FileCode } from "lucide-react"
import { testCouponBookCreation, testWalletStatePersistence, testFormSubmission } from "@/lib/test-utils"

export function DebugWallet() {
  const [walletStatus, setWalletStatus] = useState<string>("Loading...")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  const refreshStatus = async () => {
    try {
      setError(null)
      setSuccessMessage(null)
      const wallet = await getWalletData()
      console.log("Current wallet data:", wallet) // Debug log
      debugStorage() // Log current storage state

      if (wallet) {
        setWalletStatus(`Active (${wallet.type})`)
        setWalletAddress(wallet.publicAddress)
      } else {
        setWalletStatus("No Wallet")
        setWalletAddress("")
        setSuccessMessage("Wallet data is cleared and ready")
      }
    } catch (error) {
      console.error("Error refreshing wallet status:", error)
      setWalletStatus("Error")
      setError("Failed to retrieve wallet data")
    }
  }

  useEffect(() => {
    refreshStatus()

    // Add event listener for wallet updates
    window.addEventListener("walletUpdated", refreshStatus)
    return () => {
      window.removeEventListener("walletUpdated", refreshStatus)
    }
  }, [])

  const loadMockWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      console.log("Loading mock wallet:", mockMerchantWallet)

      await setWalletData(mockMerchantWallet)
      setSuccessMessage("Mock wallet loaded successfully")
      console.log("Mock wallet loaded successfully")

      await refreshStatus()
    } catch (error: any) {
      console.error("Failed to load mock wallet:", error)
      setError(error?.message || "Failed to load mock wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const clearWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      await clearWalletData()
      setSuccessMessage("Wallet cleared successfully")
      console.log("Wallet cleared successfully")

      await refreshStatus()
    } catch (error: any) {
      console.error("Failed to clear wallet:", error)
      setError(error?.message || "Failed to clear wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const runBasicTests = () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      setTestResults(null)

      const result = testCouponBookCreation()

      if (result) {
        setSuccessMessage("Tests completed successfully")
      } else {
        setError("Tests failed. Check console for details.")
      }
    } catch (error: any) {
      console.error("Test execution error:", error)
      setError(error?.message || "Test execution failed")
    } finally {
      setIsLoading(false)
    }
  }

  const runWalletTests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      setTestResults(null)

      const result = await testWalletStatePersistence()
      setTestResults(result)

      if (result.success) {
        setSuccessMessage("Wallet tests completed successfully")
      } else {
        setError("Wallet tests failed. Check console for details.")
      }
    } catch (error: any) {
      console.error("Wallet test execution error:", error)
      setError(error?.message || "Wallet test execution failed")
    } finally {
      setIsLoading(false)
    }
  }

  const runFormTests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      setTestResults(null)

      const result = await testFormSubmission()
      setTestResults(result)

      if (result.success) {
        setSuccessMessage("Form tests completed successfully")
      } else {
        setError("Form tests failed. Check console for details.")
      }
    } catch (error: any) {
      console.error("Form test execution error:", error)
      setError(error?.message || "Form test execution failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">
              Status: <span className="font-normal">{walletStatus}</span>
            </p>
            {walletAddress && <p className="text-sm font-mono truncate">Address: {walletAddress}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-700">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {testResults && (
            <Alert variant="default" className="border-blue-500 bg-blue-50 text-blue-700">
              <AlertDescription>
                <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(testResults, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={loadMockWallet} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Mock Wallet"
              )}
            </Button>
            <Button variant="destructive" onClick={clearWallet} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Wallet"
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button variant="secondary" onClick={runBasicTests} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Bug className="mr-2 h-4 w-4" />
                  Basic Tests
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={runWalletTests} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Beaker className="mr-2 h-4 w-4" />
                  Wallet Tests
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={runFormTests} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FileCode className="mr-2 h-4 w-4" />
                  Form Tests
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}