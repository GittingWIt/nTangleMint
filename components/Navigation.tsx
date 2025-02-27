"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Copy, LogOut, Check } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { clearWalletData, getWalletData } from "@/lib/storage"
import type { WalletData } from "@/types"
import Link from "next/link"

function shortenAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

// Public paths that don't require wallet authentication
const PUBLIC_PATHS = ["/", "/about", "/test-bsv", "/wallet-generation", "/wallet-restoration"]

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [walletData, setWalletData] = React.useState<WalletData | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNavigating, setIsNavigating] = React.useState(false)
  const initializationAttempted = React.useRef(false)
  const mounted = React.useRef(true)

  // Function to check if current path matches wallet type
  const checkPathMatchesWalletType = (path: string, data: WalletData | null) => {
    if (!data) return true // Allow if no wallet data (public paths)
    const pathSegments = path.split("/")
    const mainPath = pathSegments[1] // Get first path segment after /
    return mainPath === data.type || PUBLIC_PATHS.includes(path)
  }

  const loadWalletData = React.useCallback(async () => {
    if (!mounted.current || initializationAttempted.current) return

    try {
      setIsLoading(true)
      initializationAttempted.current = true

      const data = await getWalletData()
      if (!mounted.current) return

      console.log("[Navigation] Loaded wallet data:", {
        exists: !!data,
        type: data?.type,
        path: pathname,
      })

      setWalletData(data)
      console.log("[Navigation] Wallet data set:", data)

      // Handle routing based on wallet state
      if (data) {
        // If we have wallet data but are on a path that doesn't match the wallet type
        if (!checkPathMatchesWalletType(pathname, data)) {
          console.log("[Navigation] Path mismatch, redirecting to correct dashboard")
          setTimeout(() => {
            router.push(`/${data.type}`)
          }, 100)
        }
      } else if (!PUBLIC_PATHS.includes(pathname)) {
        // If no wallet data and not on public path, redirect to wallet generation
        console.log("[Navigation] No wallet data, redirecting to wallet generation")
        setTimeout(() => {
          router.push("/wallet-generation")
        }, 100)
      }
    } catch (err) {
      console.error("[Navigation] Failed to load wallet data:", err)
    } finally {
      if (mounted.current) {
        setIsLoading(false)
      }
    }
  }, [checkPathMatchesWalletType, getWalletData, mounted])

  React.useEffect(() => {
    const mounted = { current: true }

    loadWalletData()

    const handleWalletUpdate = () => {
      console.log("[Navigation] Wallet updated event received")
      initializationAttempted.current = false // Reset to allow recheck
      loadWalletData()
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("storage", handleWalletUpdate)

    return () => {
      mounted.current = false
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("storage", handleWalletUpdate)
    }
  }, [loadWalletData])

  const handleNavigation = async (path: string) => {
    if (!path || isNavigating) return
    try {
      setIsNavigating(true)
      const validPath = path.startsWith("/") ? path : `/${path}`

      // Check if navigation is allowed based on wallet state
      if (!checkPathMatchesWalletType(validPath, walletData)) {
        console.log("[Navigation] Invalid path for wallet type")
        return
      }

      await router.push(validPath)
    } catch (error) {
      console.error("[Navigation] Error navigating to", path, ":", error)
    } finally {
      setIsNavigating(false)
    }
  }

  const handleCopyAddress = async () => {
    if (!walletData?.publicAddress) return
    try {
      await navigator.clipboard.writeText(walletData.publicAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy address:", err)
    }
  }

  const handleLogout = async () => {
    try {
      await clearWalletData()
      setWalletData(null)
      setShowLogoutDialog(false)
      router.push("/")
    } catch (err) {
      console.error("[Navigation] Logout error:", err)
    }
  }

  // Determine if we should show wallet controls
  const showWalletControls = walletData?.publicAddress && !isLoading

  console.log("[Navigation] Rendering with wallet data:", walletData)
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="font-bold">nTangleMint</span>
        </Link>
        <nav className="flex flex-1 items-center justify-between space-x-6 text-sm font-medium">
          <div className="flex gap-6">
            <button
              onClick={() => handleNavigation("/about")}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/about" ? "text-foreground" : "text-foreground/60",
              )}
            >
              About
            </button>
            {showWalletControls && (
              <button
                onClick={() => handleNavigation(`/${walletData.type}`)}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname.includes(walletData.type) ? "text-foreground" : "text-foreground/60",
                )}
              >
                Dashboard
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {showWalletControls ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-mono text-sm">
                    {shortenAddress(walletData.publicAddress)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={handleCopyAddress}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Address
                      </>
                    )}
                  </DropdownMenuItem>
                  <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setShowLogoutDialog(true)
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear your wallet data from this device. Make sure you have saved your recovery
                          phrase.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isLoading && (
                <Button variant="outline" onClick={() => handleNavigation("/wallet-generation")}>
                  Create/Restore Wallet
                </Button>
              )
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}