"use client"

import { useRouter, usePathname } from "next/navigation"
import { Menu, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface WalletData {
  publicAddress: string
  type: "merchant" | "customer"
  businessName?: string
}

function shortenAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [walletData, setWalletData] = React.useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  React.useEffect(() => {
    const loadWalletData = async () => {
      try {
        setIsLoading(true)
        console.log("[Navigation] Loading wallet data from localStorage...")

        // Check localStorage for active session
        const sessionData = localStorage.getItem("bsv-wallet-session")
        if (sessionData) {
          const session = JSON.parse(sessionData)
          console.log("[Navigation] ✅ Found active wallet session:", session.address)
          setWalletData({
            publicAddress: session.address,
            type: session.type,
            ...(session.businessName !== undefined ? { businessName: session.businessName } : {}),
          })
        } else {
          console.log("[Navigation] No active wallet session found")
          setWalletData(null)
        }
      } catch (err) {
        console.error("[Navigation] Failed to load wallet from localStorage:", err)
        setWalletData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletData()

    // Listen for wallet updates (from other components)
    const handleWalletUpdate = () => loadWalletData()
    window.addEventListener("bsvWalletUpdated", handleWalletUpdate)
    window.addEventListener("bsvWalletCleared", handleWalletUpdate)

    return () => {
      window.removeEventListener("bsvWalletUpdated", handleWalletUpdate)
      window.removeEventListener("bsvWalletCleared", handleWalletUpdate)
    }
  }, [])

  // Redirect away from wallet generation if already logged in
  React.useEffect(() => {
    if (!isLoading && walletData && pathname === "/wallet-generation") {
      console.log("[Navigation] User already has wallet, redirecting from wallet generation page")
      router.push(getDashboardRoute())
    }
  }, [isLoading, walletData, pathname, router])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("[Navigation] Logging out...")

      // Clear localStorage
      localStorage.removeItem("bsv-wallet-session")
      localStorage.removeItem("bsv-wallet-data")

      // Add a small delay to ensure session is cleared
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Clear local state
      setWalletData(null)

      // Trigger wallet cleared event for other components
      window.dispatchEvent(new Event("bsvWalletCleared"))

      console.log("[Navigation] Successfully logged out")

      // Navigate to home
      router.push("/")
    } catch (err) {
      console.error("[Navigation] Logout error:", err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleCreateWallet = () => {
    router.push("/wallet-generation")
  }

  // Role-based routing
  const getDashboardRoute = () => {
    if (!walletData) return "/wallet-generation"
    return walletData.type === "merchant" ? "/merchant" : "/customer"
  }

  const getDashboardLabel = () => {
    if (!walletData) return "Dashboard"
    return walletData.type === "merchant" ? "Merchant Dashboard" : "Dashboard"
  }

  const handleCopyAddress = async () => {
    if (walletData?.publicAddress) {
      try {
        await navigator.clipboard.writeText(walletData.publicAddress)
        console.log("[Navigation] Address copied to clipboard")
      } catch (err) {
        console.error("[Navigation] Failed to copy address:", err)
      }
    }
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
                pathname.includes("/merchant") || pathname.includes("/customer") ? "text-gray-900" : "text-gray-600",
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
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded capitalize">{walletData.type}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <button className="w-full" onClick={handleCopyAddress}>
                        <span>Copy Address</span>
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to logout? This will disconnect your BSV wallet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                              {isLoggingOut ? "Logging out..." : "Logout"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" onClick={handleCreateWallet}>
                  Connect BSV Wallet
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}