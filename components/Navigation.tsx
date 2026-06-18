"use client"

import { useRouter, usePathname } from "next/navigation"
import { Copy, LogOut, Check, LayoutGrid, Package, Zap, Settings, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWallet } from "@/contexts/wallet-context"
import Link from "next/link"
import { useState, useEffect } from "react"
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
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { wallet, clearWallet, setWallet } = useWallet()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    
    // Load wallet from session storage if it exists and not already loaded
    if (!wallet) {
      try {
        const storedWallet = sessionStorage.getItem("ntanglemint_wallet")
        if (storedWallet) {
          const parsedWallet = JSON.parse(storedWallet)
          setWallet(parsedWallet)
        }
      } catch (error) {
        console.log("[v0] Failed to restore wallet from session:", error)
      }
    }
  }, [])

  const handleCopyAddress = async () => {
    if (!wallet?.publicAddress) {
      console.log("[v0] No wallet address to copy")
      return
    }
    try {
      await navigator.clipboard.writeText(wallet.publicAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy address:", err)
    }
  }

  const handleLogout = () => {
    clearWallet()
    setShowLogoutDialog(false)
    router.push("/")
  }

  const handleCreateWallet = () => {
    router.push("/wallet")
  }

  if (!isHydrated) {
    return null
  }

  const isInDashboard = pathname.includes("/dashboard")
  const isInSettings = pathname.includes("/settings") || pathname.includes("/security")

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-muted/50 overflow-y-auto flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg">nTangle<span className="text-green-600">Mint</span></span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          {wallet ? (
            <>
              {/* Dashboard Section */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                  Main
                </p>
                
                <Link href="/dashboard">
                  <Button
                    variant={isInDashboard ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>

              {/* Creator Section - only show if wallet exists */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                  Creator
                </p>

                <Link href="/dashboard?tab=programs">
                  <Button
                    variant={pathname === "/dashboard" && new URLSearchParams(window?.location?.search).get("tab") === "programs" ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Package className="h-4 w-4" />
                    My Programs
                  </Button>
                </Link>
              </div>

              {/* User Section - only show if wallet exists */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                  Rewards
                </p>

                <Link href="/dashboard?tab=cards">
                  <Button
                    variant={pathname === "/dashboard" && new URLSearchParams(window?.location?.search).get("tab") === "cards" ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Punch Cards
                  </Button>
                </Link>
              </div>

              {/* Settings Section - only show if wallet exists */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                  Account
                </p>

                <Link href="/settings">
                  <Button
                    variant={pathname.includes("/settings") ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                Main
              </p>
              <Link href="/wallet">
                <Button
                  variant={pathname === "/wallet" ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* About Link */}
        <div className="border-t p-4">
          <Link href="/about">
            <Button
              variant={pathname === "/about" ? "default" : "ghost"}
              className="w-full justify-start gap-2 text-xs"
              size="sm"
            >
              <Info className="h-4 w-4" />
              About
            </Button>
          </Link>
        </div>

        {/* Wallet Info Footer */}
        <div className="border-t p-4 mt-auto">
          {wallet ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2 font-mono text-xs justify-start bg-transparent">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {wallet.publicAddress?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate">
                    {shortenAddress(wallet.publicAddress)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 -ml-4 mb-2">
                <DropdownMenuItem disabled className="flex-col items-start py-3">
                  <div className="text-xs text-muted-foreground mb-2">Wallet Address</div>
                  <div className="font-mono text-xs break-all bg-muted p-2 rounded w-full">
                    {wallet.publicAddress}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <button className="w-full cursor-pointer" onClick={handleCopyAddress}>
                    <div className="flex items-center w-full">
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Address Copied!</span>
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
                  <button className="w-full cursor-pointer text-destructive" onClick={() => setShowLogoutDialog(true)}>
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout Wallet</span>
                    </div>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleCreateWallet} className="w-full gap-2" size="sm">
              <span>Connect Wallet</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout Wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to recreate or restore your wallet to access your programs and punch cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}