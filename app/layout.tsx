import type { Metadata } from "next"
import { Inter } from "next/font/google"
import RootLayoutClient from "./layout-client"
import "./globals.css"
import type React from "react"
import * as Sentry from "@sentry/nextjs"

// Initialize Sentry on the server
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    debug: false,
  })
}

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
  // Rebuild cache
  return <RootLayoutClient inter={inter.className}>{children}</RootLayoutClient>
}