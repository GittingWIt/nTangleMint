"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { walletState } from "@/lib/wallet-sync"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { debug } from "@/lib/debug"
import { fixWalletInitialization } from "@/lib/wallet-fix"

interface WalletVerificationProps {
  children: React.ReactNode
  showStatus?: boolean
  redirectPath?: string
  requiredType?: "merchant" | "user"
  onWalletConnected?: () => void
}

export function WalletVerification({
  children,
  showStatus = true,
  redirectPath,
  requiredType = "merchant",
  onWalletConnected,
}: WalletVerificationProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "verified" | "error" | "not-found">("loading")
  const [wallet, setWallet] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const checkAttemptsRef = useRef(0)

  // Track component mount for Fast Refresh detection
  useEffect(() => {
    mountedRef.current = true
    debug("WalletVerification component mounted")

    return () => {
      mountedRef.current = false
      debug("WalletVerification component unmounted")
    }
  }, [])

  // Check wallet on mount
  useEffect(() => {
    const checkWallet = async () => {
      try {
        checkAttemptsRef.current += 1

        // Get the latest wallet state
        const currentWallet = walletState.getWalletData(true)

        // Log the current state for debugging
        debug("WalletVerification component state check:", {
          hasWallet: !!currentWallet,
          walletType: currentWallet?.type,
          address: currentWallet?.publicAddress || "No address",
          attempt: checkAttemptsRef.current,
        })

        if (!currentWallet) {
          // If this is the first attempt, try loading from storage again
          if (checkAttemptsRef.current === 1) {
            setTimeout(checkWallet, 500)
            return
          }

          setStatus("not-found")
          setError(`No ${requiredType} wallet found. Please connect your wallet.`)
          return
        }

        // Check if wallet has required properties
        if (!currentWallet.publicAddress) {
          debug("Wallet missing publicAddress property", currentWallet)
          setStatus("error")
          setError("Invalid wallet data: Missing public address")
          return
        }

        // Check if wallet type matches required type
        if (requiredType && currentWallet.type !== requiredType) {
          setStatus("error")
          setError(`This page requires a ${requiredType} wallet, but found a ${currentWallet.type} wallet.`)
          return
        }

        // Wallet is valid
        setWallet(currentWallet)
        setStatus("verified")

        // Call onWalletConnected callback if provided
        if (onWalletConnected) {
          onWalletConnected()
        }
      } catch (err) {
        console.error("Error checking wallet:", err)
        setStatus("error")
        setError("Failed to verify wallet status")
      }
    }

    checkWallet()
  }, [requiredType, onWalletConnected])

  // Handle connect wallet button click
  const handleConnectWallet = async () => {
    try {
      setStatus("loading")
      setError(null)

      // Use the centralized wallet fix function
      const result = await fixWalletInitialization()

      if (result.success) {
        // Re-check wallet after fixing
        const currentWallet = walletState.getWalletData(true)

        if (currentWallet && currentWallet.publicAddress) {
          setWallet(currentWallet)
          setStatus("verified")

          // Call onWalletConnected callback if provided
          if (onWalletConnected) {
            onWalletConnected()
          }

          // Refresh the page to ensure all components recognize the new wallet
          window.location.reload()
        } else {
          setStatus("error")
          setError("Wallet initialization succeeded but wallet data is invalid")
        }
      } else {
        setStatus("error")
        setError(result.message || "Failed to connect wallet")
      }
    } catch (err) {
      console.error("Error connecting wallet:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    }
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verifying wallet...</span>
      </div>
    )
  }

  // Show error state
  if (status === "error" || status === "not-found") {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription data-testid="wallet-error">
            {error || `No ${requiredType} wallet found. Please connect your wallet.`}
          </AlertDescription>
        </Alert>
        <Button onClick={handleConnectWallet} className="w-full md:w-auto">
          Connect Wallet
        </Button>
      </div>
    )
  }

  // Show success state with wallet info
  if (status === "verified" && showStatus && wallet) {
    // Safely access publicAddress with fallback
    const address = wallet.publicAddress || "Unknown Address"
    const addressStart = address.substring(0, 8)
    const addressEnd = address.length > 8 ? address.substring(address.length - 4) : ""

    return (
      <>
        <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
          <AlertDescription className="text-green-700" data-testid="wallet-status">
            Wallet connected: {addressStart}...{addressEnd}
          </AlertDescription>
        </Alert>
        {children}
      </>
    )
  }

  // Default case: just render children if verified
  return status === "verified" ? <>{children}</> : null
}