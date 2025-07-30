"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      try {
        // Skip auth checks for public routes
        if (pathname.startsWith("/(public)") || pathname === "/") {
          setIsLoading(false)
          return
        }

        // Skip auth checks for wallet generation
        if (pathname === "/wallet-generation") {
          setIsLoading(false)
          return
        }

        // Check for wallet session
        const sessionData = localStorage.getItem("bsv-wallet-session")

        if (!sessionData) {
          // No session found, redirect to wallet generation
          console.log("[ClientLayout] No wallet session found, redirecting to wallet generation")
          router.push("/wallet-generation")
          return
        }

        let session
        try {
          session = JSON.parse(sessionData)
        } catch (error) {
          console.error("[ClientLayout] Invalid session data, clearing and redirecting")
          localStorage.removeItem("bsv-wallet-session")
          router.push("/wallet-generation")
          return
        }

        // Validate session structure
        if (!session.address || !session.type) {
          console.error("[ClientLayout] Invalid session structure, clearing and redirecting")
          localStorage.removeItem("bsv-wallet-session")
          router.push("/wallet-generation")
          return
        }

        console.log(`[ClientLayout] Valid ${session.type} session found for: ${session.address}`)

        // Route based on wallet type and current path
        if (pathname.startsWith("/merchant") || pathname.startsWith("/(protected)/merchant")) {
          if (session.type !== "merchant") {
            console.log("[ClientLayout] Non-merchant trying to access merchant area, redirecting to customer")
            router.push("/customer")
            return
          }
        } else if (pathname.startsWith("/customer") || pathname.startsWith("/(protected)/customer")) {
          if (session.type !== "customer") {
            console.log("[ClientLayout] Non-customer trying to access customer area, redirecting to merchant")
            router.push("/merchant")
            return
          }
        } else if (pathname.startsWith("/(protected)/admin")) {
          if (session.type !== "admin") {
            console.log("[ClientLayout] Non-admin trying to access admin area, redirecting based on type")
            router.push(session.type === "merchant" ? "/merchant" : "/customer")
            return
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("[ClientLayout] Error in auth check:", error)
        setIsLoading(false)
      }
    }

    checkAuthAndRedirect()
  }, [pathname, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}