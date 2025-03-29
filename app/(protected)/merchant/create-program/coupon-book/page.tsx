"use client"

import { useEffect, useState } from "react"
import { CreateProgramForm } from "@/components/create-program-form"
import { walletState } from "@/lib/wallet-sync"
import { fixWalletInitialization } from "@/lib/wallet-fix"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function CreateCouponBookPage() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-initialize wallet on page load
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if wallet already exists and is valid
        const wallet = walletState.getWalletData(true)

        if (wallet && wallet.publicAddress && wallet.type === "merchant") {
          // Wallet is already valid
          setIsInitializing(false)
          return
        }

        // Fix or create wallet automatically
        const result = await fixWalletInitialization()

        if (!result.success) {
          setError("Could not initialize merchant wallet. Please try again.")
        }
      } catch (err) {
        console.error("Error initializing wallet:", err)
        setError("An unexpected error occurred while initializing your wallet.")
      } finally {
        setIsInitializing(false)
      }
    }

    initializeWallet()
  }, [])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Initializing merchant wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Create Coupon Book Program</h1>
      <p className="text-muted-foreground">Create a new digital coupon book program for your customers.</p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CreateProgramForm />
    </div>
  )
}