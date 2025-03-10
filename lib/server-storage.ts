import { cookies } from "next/headers"
import type { WalletData } from "@/types"
import { debug } from "./debug"

// Server-side wallet validation
async function isWalletValid(wallet: WalletData | null): Promise<boolean> {
  if (!wallet) return false

  try {
    return !!wallet.publicAddress && !!wallet.type && (wallet.type === "user" || wallet.type === "merchant")
  } catch (err) {
    console.error("Server: Error validating wallet:", err)
    return false
  }
}

// Get wallet data from cookies (server-side only)
export async function getServerWalletData(): Promise<WalletData | null> {
  try {
    debug("Server: Getting wallet data from cookies")

    const cookieStore = cookies()
    const walletCookie = cookieStore.get("walletData")

    if (!walletCookie?.value) {
      debug("Server: No wallet cookie found")
      return null
    }

    try {
      const walletData = JSON.parse(walletCookie.value)
      if (await isWalletValid(walletData)) {
        debug("Server: Valid wallet data found in cookie")
        return walletData
      }

      debug("Server: Invalid wallet data in cookie")
      return null
    } catch (parseError) {
      debug("Server: Error parsing wallet cookie:", parseError)
      return null
    }
  } catch (err) {
    console.error("Server: Failed to get wallet data:", err)
    return null
  }
}