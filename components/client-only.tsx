"use client"

import type React from "react"
import { useState, useEffect, type ReactNode } from "react"

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * A wrapper component that only renders its children on the client side
 * This prevents hydration errors and issues with browser APIs
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Higher-order component that wraps a component to make it client-only
 */
export function withClientOnly<P extends object>(Component: React.ComponentType<P>, fallback: ReactNode = null) {
  return function WithClientOnly(props: P) {
    return (
      <ClientOnly fallback={fallback}>
        <Component {...props} />
      </ClientOnly>
    )
  }
}