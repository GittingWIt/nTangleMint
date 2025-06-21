"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Error</h1>
      <p className="mb-4">Something went wrong while loading the dashboard.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}