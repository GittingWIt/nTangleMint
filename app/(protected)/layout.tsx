import type React from "react"
import { WalletProvider } from "@/contexts/wallet-context"
import { getWalletData } from "@/lib/storage"
import { initializeWalletState } from "@/lib/wallet-sync"

// Initialize wallet state on the server
async function initWallet() {
  try {
    const wallet = await getWalletData()
    await initializeWalletState(wallet)
    return wallet
  } catch (error) {
    console.error("Failed to initialize wallet state:", error)
    return null
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pre-initialize wallet state
  await initWallet()

  return (
    <WalletProvider>
      <div className="min-h-screen">
        <div className="container mx-auto p-4">{children}</div>
      </div>
    </WalletProvider>
  )
}