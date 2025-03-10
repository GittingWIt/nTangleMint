"use client"

import { useRouter, usePathname } from "next/navigation"
import { Menu, Copy, LogOut, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { clearWalletData, getWalletData } from "@/lib/storage"
import type { WalletData } from "@/types"
import Link from "next/link"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function shortenAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [walletData, setWalletData] = React.useState<WalletData | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    const loadWalletData = async () => {
      try {
        const data = await getWalletData()
        if (mounted) {
          setWalletData(data)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Failed to load wallet data:", err)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadWalletData()

    const handleWalletUpdate = () => {
      loadWalletData()
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("storage", handleWalletUpdate)

    return () => {
      mounted = false
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("storage", handleWalletUpdate)
    }
  }, [])

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
      console.error("Logout error:", err)
    }
  }

  const handleCreateWallet = () => {
    router.push("/wallet-generation")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-bold">nTangleMint</span>
          </Link>
          <Link
            href="/about"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground/80",
              pathname === "/about" ? "text-foreground" : "text-foreground/60",
            )}
          >
            About
          </Link>
          {walletData && (
            <Link
              href={`/${walletData.type}/dashboard`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80",
                pathname.includes("/dashboard") ? "text-foreground" : "text-foreground/60",
              )}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {walletData ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="font-mono">
                        <Menu className="mr-2 h-4 w-4" />
                        {shortenAddress(walletData.publicAddress)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <button className="w-full" onClick={handleCopyAddress}>
                          <div className="flex items-center">
                            {copied ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>Copy Address</span>
                              </>
                            )}
                          </div>
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <button className="w-full" onClick={() => setShowLogoutDialog(true)}>
                          <div className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                          </div>
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will clear your wallet data from this device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
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