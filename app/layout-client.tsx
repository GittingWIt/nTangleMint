"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/contexts/wallet-context"
import Navigation from "@/components/Navigation"
import { initSentry } from "@/lib/sentry"
import type React from "react"

export default function RootLayoutClient({
  children,
  inter,
}: {
  children: React.ReactNode
  inter: string
}) {
  useEffect(() => {
    // Initialize Sentry once on client mount
    initSentry()
  }, [])
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <div className="relative min-h-screen flex">
              <Navigation />
              <main className="flex-1 ml-64">{children}</main>
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}