import type React from "react"
import { WalletProvider } from "@/contexts/wallet-context"

// Add these directives at the layout level
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletProvider>
      <div className="min-h-screen">
        <div className="container mx-auto p-4">{children}</div>
      </div>
    </WalletProvider>
  )
}