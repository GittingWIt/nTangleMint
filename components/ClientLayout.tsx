"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getWalletData, debugStorage } from "@/lib/storage"
import { usePathname, useRouter } from "next/navigation"
import { PUBLIC_PATHS, MERCHANT_PATHS } from "@/lib/constants"
import { ThemeProvider } from "@/components/theme-provider"

const DEBUG = process.env.NODE_ENV === "development"
const RETRY_DELAY = 500

function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[ClientLayout Debug]:", ...args)
  }
}

function ClientLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState("Starting initialization")
  const [error, setError] = useState<string | null>(null)
  const initAttempts = useRef(0)
  const maxAttempts = 3
  const initialized = useRef(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const shouldSkipInit = () => {
      if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return true
      if (MERCHANT_PATHS.some((path) => pathname.startsWith(path))) return true
      return false
    }

    if (shouldSkipInit()) {
      setIsLoading(false)
      return
    }

    if (initialized.current) {
      return
    }

    const initializeLayout = async () => {
      try {
        if (!mounted || initialized.current) return

        initAttempts.current++
        debug(`Initialization attempt ${initAttempts.current}/${maxAttempts}`)
        setLoadingPhase(`Checking wallet status (Attempt ${initAttempts.current}/${maxAttempts})`)
        setError(null)

        if (DEBUG) {
          debugStorage()
        }

        const walletData = await getWalletData()
        debug("Wallet data check:", {
          exists: !!walletData,
          type: walletData?.type,
          path: pathname,
        })

        if (!walletData || !walletData.type || !walletData.publicAddress) {
          if (initAttempts.current < maxAttempts) {
            timeoutId = setTimeout(initializeLayout, RETRY_DELAY)
            return
          }
          initialized.current = true
          if (mounted) {
            router.push("/wallet-generation")
            return
          }
        }

        initialized.current = true
        if (mounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Initialization error:", error)

        if (initAttempts.current < maxAttempts && mounted && !initialized.current) {
          timeoutId = setTimeout(initializeLayout, RETRY_DELAY)
        } else {
          initialized.current = true
          if (mounted) {
            setError("Unable to initialize wallet. Please try refreshing the page.")
            setIsLoading(false)
          }
        }
      }
    }

    initializeLayout()

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [pathname, router])

  useEffect(() => {
    const handleWalletUpdate = () => {
      debug("Wallet update detected")
      if (DEBUG) {
        debugStorage()
      }
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("storage", handleWalletUpdate)

    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("storage", handleWalletUpdate)
    }
  }, [])

  if (isLoading && !PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">{loadingPhase}</p>
            {initAttempts.current > 1 && (
              <p className="text-xs text-muted-foreground">
                Attempt {initAttempts.current} of {maxAttempts}
              </p>
            )}
          </div>
        </main>
      </div>
    )
  }

  if (error && !PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="container mx-auto p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </ThemeProvider>
  )
}