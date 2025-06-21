"use client"

import { useRouter, usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function shortenAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [walletData, setWalletData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadWalletData = () => {
      try {
        // Direct localStorage access - no complex storage systems
        const walletDataStr = localStorage.getItem("walletData")
        if (!walletDataStr) {
          setWalletData(null)
          setIsLoading(false)
          return
        }

        const wallet = JSON.parse(walletDataStr)
        if (!wallet || !wallet.publicAddress) {
          setWalletData(null)
          setIsLoading(false)
          return
        }

        setWalletData(wallet)
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load wallet data:", err)
        setWalletData(null)
        setIsLoading(false)
      }
    }

    loadWalletData()

    // Listen for wallet updates
    const handleWalletUpdate = () => loadWalletData()
    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("walletCleared", handleWalletUpdate)

    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("walletCleared", handleWalletUpdate)
    }
  }, [])

  const handleLogout = () => {
    try {
      // Simple logout - just clear localStorage
      localStorage.removeItem("walletData")

      // Clear local state
      setWalletData(null)

      // Trigger wallet cleared event
      window.dispatchEvent(new Event("walletCleared"))

      // Navigate to home
      router.push("/")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const handleCreateWallet = () => {
    router.push("/wallet-generation")
  }

  // Simple role-based routing
  const getDashboardRoute = () => {
    if (!walletData) return "/wallet-generation"
    return walletData.type === "merchant" ? "/merchant" : "/dashboard"
  }

  const getDashboardLabel = () => {
    if (!walletData) return "Dashboard"
    return walletData.type === "merchant" ? "Merchant Dashboard" : "Dashboard"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-gray-900">nTangleMint</span>
          </Link>
          <Link
            href="/about"
            className={cn(
              "text-sm font-medium transition-colors hover:text-gray-900",
              pathname === "/about" ? "text-gray-900" : "text-gray-600",
            )}
          >
            About
          </Link>
          {walletData && (
            <Link
              href={getDashboardRoute()}
              className={cn(
                "text-sm font-medium transition-colors hover:text-gray-900",
                pathname.includes("/dashboard") || pathname.includes("/merchant") || pathname.includes("/user")
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              {getDashboardLabel()}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {walletData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="font-mono">
                      <Menu className="mr-2 h-4 w-4" />
                      {shortenAddress(walletData.publicAddress)}
                      {walletData.type && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded capitalize">{walletData.type}</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <button className="w-full" onClick={handleLogout}>
                        <span>Logout</span>
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" onClick={handleCreateWallet}>
                  Create/Restore Wallet
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}