"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { getCurrentWallet } from "@/lib/services/wallet-service"

interface UseWalletRedirectOptions {
  /**
   * If true, redirect to dashboard when wallet exists (used on wallet creation page)
   * If false, redirect to wallet when wallet doesn't exist (used on dashboard)
   */
  redirectToWalletWhenExists?: boolean
  /**
   * Optional: callback to check if we should skip redirect
   * (e.g., showing seed phrase after wallet creation)
   */
  skipCondition?: boolean
}

/**
 * Hook to handle wallet-based redirects consistently across the app
 * 
 * Consolidates redirect logic for:
 * - Wallet page: redirects to dashboard if wallet already exists (unless showing seed phrase)
 * - Dashboard: redirects to wallet creation if no wallet exists
 */
export function useWalletRedirect(options: UseWalletRedirectOptions = {}) {
  const router = useRouter()
  const { wallet, setWallet } = useWallet()
  const { redirectToWalletWhenExists = false, skipCondition = false } = options

  useEffect(() => {
    if (skipCondition) return

    if (redirectToWalletWhenExists) {
      // On wallet page: redirect to dashboard if wallet exists
      if (wallet) {
        router.push("/dashboard")
      }
    } else {
      // On dashboard/protected pages: redirect to wallet if no wallet exists
      const currentWallet = getCurrentWallet()
      if (!currentWallet) {
        router.push("/wallet")
        return
      }
      // Sync wallet to context if not already set
      if (!wallet) {
        setWallet(currentWallet)
      }
    }
  }, [wallet, redirectToWalletWhenExists, skipCondition, router, setWallet])
}