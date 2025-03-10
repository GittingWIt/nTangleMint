import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import Navigation from "@/components/Navigation"
import "@/styles/globals.css"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nTangleMint",
  description: "Bitcoin SV Loyalty Program Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>
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