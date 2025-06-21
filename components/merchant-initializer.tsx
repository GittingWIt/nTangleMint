"use client"

import { useEffect, useRef } from "react"
import { debug } from "@/lib/debug"
import { getWalletData } from "@/lib/storage-compat"
import { determineWalletRole, setWalletRole } from "@/lib/wallet-roles"

export function MerchantInitializer() {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeMerchant = async () => {
      try {
        // Get wallet data
        const walletData = await getWalletData()
        if (!walletData) return

        // Check if this is the known merchant address
        if (walletData.publicAddress === "19jXXicm7YynAH73xcau38pkSQKjZQer") {
          debug("MerchantInitializer: Found known merchant address")

          // Ensure role is set to merchant
          const role = determineWalletRole(walletData)
          if (role !== "merchant") {
            debug("MerchantInitializer: Setting role to merchant")
            setWalletRole(walletData.publicAddress, "merchant")
          }

          // Ensure wallet type is merchant
          if (walletData.type !== "merchant") {
            debug("MerchantInitializer: Wallet type is not merchant, fixing...")
            // This would require updating the wallet data, which should be handled by the wallet provider
          }
        }
      } catch (error) {
        console.error("Error in MerchantInitializer:", error)
      }
    }

    initializeMerchant()
  }, [])

  // This component doesn't render anything
  return null
}