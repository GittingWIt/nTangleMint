import * as React from 'react'
import '@/styles/globals.css'
import { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import Link from "next/link"
import Head from 'next/head'
import { Button } from "@/components/ui/button"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { cn } from "@/lib/utils"
import Layout from '@/components/Layout'
import { getWalletData, shortenAddress, logoutWallet } from '@/lib/wallet-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Copy, LogOut } from 'lucide-react'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  const [walletData, setWalletData] = React.useState<ReturnType<typeof getWalletData>>(null)
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    const handleStorageChange = () => {
      const data = getWalletData()
      setWalletData(data)
    }
    
    const data = getWalletData()
    setWalletData(data)

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('walletUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('walletUpdated', handleStorageChange)
    }
  }, [])

  const handleCopyAddress = async () => {
    if (!walletData) return
    try {
      await navigator.clipboard.writeText(walletData.publicAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address')
    }
  }

  const handleLogout = () => {
    logoutWallet()
    setWalletData(null)
    setShowLogoutDialog(false)
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <Head>
        <title>nTangleMint</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">nTangleMint</span>
            </Link>
            <nav className="flex flex-1 items-center justify-between space-x-6 text-sm font-medium">
              <div className="flex gap-6">
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  About
                </Link>
                {walletData && (
                  <Link
                    href={walletData.type === 'merchant' ? '/merchants' : '/user'}
                    className="transition-colors hover:text-foreground/80 text-foreground"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {walletData ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="font-mono text-sm">
                        {shortenAddress(walletData.publicAddress)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault()
                          handleCopyAddress()
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy Address'}
                      </DropdownMenuItem>
                      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault()
                            setShowLogoutDialog(true)
                          }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will clear your wallet data from this device. Make sure you have saved your recovery phrase.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="bg-black hover:bg-black/90">
                              Logout
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/wallet-generation">Create/Restore Wallet</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </header>
        <Layout>
          <main className="container py-6">
            <Component {...pageProps} />
          </main>
        </Layout>
      </div>
    </NextThemesProvider>
  )
}