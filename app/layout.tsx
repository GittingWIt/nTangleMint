// Import global functions FIRST
import "@/lib/global-functions"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./styles/globals.css"
import type React from "react"
import Navigation from "@/components/Navigation"
import ClientLayout from "@/components/ClientLayout"

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
        <ClientLayout>
          <Navigation />
          <div className="min-h-screen bg-white">{children}</div>
        </ClientLayout>
      </body>
    </html>
  )
}