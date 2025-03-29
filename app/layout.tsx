import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { CouponHandler } from "@/components/coupon-handler"
import Navigation from "@/components/Navigation"
import "@/styles/globals.css"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nTangleMint",
  description: "Bitcoin SV Loyalty Program Platform",
  viewport: "width=device-width, initial-scale=1",
  other: {
    "cache-control": "public, max-age=60, stale-while-revalidate=300",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="http://localhost:3000" />
        <meta httpEquiv="x-dns-prefetch-control" content="off" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <CouponHandler />
            <div className="relative min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}