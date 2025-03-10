"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useWalletVerification } from "@/hooks/use-wallet-verification"
import { walletState, trackComponentMount } from "@/lib/wallet-sync"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { debug } from "@/lib/debug"

interface WalletVerificationProps {
  children: React.ReactNode
  showStatus?: boolean
  redirectPath?: string
  requiredType?: "merchant" | "user"
}

export function WalletVerification({
  children,
  showStatus = true,
  redirectPath,
  requiredType = "merchant",
}: WalletVerificationProps) {
  const router = useRouter()
  const { status, wallet, error } = useWalletVerification(redirectPath)
  const mountedRef = useRef(false)

  // Track component mount for Fast Refresh detection
  useEffect(() => {
    trackComponentMount()
    mountedRef.current = true

    debug("WalletVerification component mounted")

    return () => {
      mountedRef.current = false
      debug("WalletVerification component unmounted")
    }
  }, [])

  // Double-check wallet state on mount
  useEffect(() => {
    const checkWalletState = async () => {
      // If we're already verified, no need to check again
      if (status === "verified") return

      // If we're still loading, wait for the state to stabilize
      if (status === "loading") {
        try {
          await walletState.waitForInit(1000)
        } catch (error) {
          debug("Wallet state initialization timeout in component")
        }
      }

      // Get the latest wallet state
      const currentWallet = walletState.getWalletData(true)

      // Log the current state for debugging
      debug("WalletVerification component state check:", {
        componentStatus: status,
        walletStateHasData: !!currentWallet,
        walletAddress: currentWallet?.publicAddress?.substring(0, 8),
      })
    }

    checkWalletState()
  }, [status])

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
        {redirectPath && <Button onClick={() => router.push(redirectPath)}>Connect Wallet</Button>}
      </div>
    )
  }

  // Show success state with wallet info
  if (status === "verified" && showStatus && wallet) {
    return (
      <>
        <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
          <AlertDescription className="text-green-700" data-testid="wallet-status">
            Wallet connected: {wallet.publicAddress.substring(0, 8)}...
            {wallet.publicAddress.substring(wallet.publicAddress.length - 4)}
          </AlertDescription>
        </Alert>
        {children}
      </>
    )
  }

  // Default case: just render children if verified
  return status === "verified" ? <>{children}</> : null
}