"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { debug } from "@/lib/debug"
import { walletState } from "@/lib/wallet-sync"
import { fixWalletInitialization } from "@/lib/wallet-fix"

export function DebugWalletFix() {
  const [message, setMessage] = useState<string | null>(null)
  const [isFixing, setIsFixing] = useState(false)

  const diagnoseWallet = () => {
    const wallet = walletState.getWalletData(true)

    debug("Current wallet data:", wallet)

    if (!wallet) {
      setMessage("No wallet data found")
      return
    }

    // Check for required properties
    const issues = []

    if (!wallet.type) issues.push("Missing 'type' property")
    if (!wallet.publicAddress) issues.push("Missing 'publicAddress' property")

    if (issues.length > 0) {
      setMessage(`Wallet issues found: ${issues.join(", ")}`)
    } else {
      setMessage("Wallet data looks valid")
    }
  }

  // Update the fixWallet function to use the utility function from lib/wallet-fix.ts
  const fixWallet = async () => {
    setIsFixing(true)
    setMessage(null)

    try {
      // Use the centralized wallet fix utility instead of implementing fix logic here
      const result = await fixWalletInitialization()

      if (result.success) {
        setMessage(result.message + ". Please refresh the page.")

        // Dispatch event to notify components
        window.dispatchEvent(new Event("walletUpdated"))

        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(`Error: ${result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error fixing wallet:", error)
      setMessage(`Error fixing wallet: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Wallet Data Fixer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <div className="flex space-x-4">
            <Button onClick={diagnoseWallet} variant="outline">
              Diagnose Wallet
            </Button>
            <Button onClick={fixWallet} disabled={isFixing}>
              {isFixing ? "Fixing..." : "Fix Wallet Data"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}