"use client"

import type React from "react"
import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface ClientLayoutProps {
  children: ReactNode
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // App Router doesn't have router.asPath, so we'll use window.location.pathname
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname
      localStorage.setItem("lastVisitedPath", currentPath)
    }
  }, [])

  useEffect(() => {
    // On mount, redirect to the last visited path if it exists
    const lastVisitedPath = localStorage.getItem("lastVisitedPath")
    if (lastVisitedPath && typeof window !== "undefined" && lastVisitedPath !== window.location.pathname) {
      router.push(lastVisitedPath)
    }
  }, [router])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return <div>{children}</div>
}

export default ClientLayout