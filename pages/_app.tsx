import '@/styles/globals.css'
import { useState } from 'react'
import { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import Layout from '@/components/Layout'

const inter = Inter({ subsets: ["latin"] })

export default function MyApp({ Component, pageProps }: AppProps) {
  // const [accountType, setAccountType] = useState<'merchant' | 'user'>('user')

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">nTangleMint</span>
            </Link>
            <nav className="flex flex-1 items-center justify-between space-x-6 text-sm font-medium">
              <div className="flex gap-6">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  About
                </Link>
                <Link
                  href="/merchants"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Merchants
                </Link>
                <Link
                  href="/users"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Users
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/create-restore-wallet">
                  <Button variant="outline">Create/Restore Wallet</Button>
                </Link>
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
    </ThemeProvider>
  )
}