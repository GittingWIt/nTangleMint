"use client"

import { useState, useEffect } from "react"
import { getCachedBlockHeight, refreshBlockHeight, formatBlockHeight } from "@/lib/services/block-height-service"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface BlockHeightDisplayProps {
  compact?: boolean
}

export function BlockHeightDisplay({ compact = false }: BlockHeightDisplayProps) {
  const [blockHeight, setBlockHeight] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    getCachedBlockHeight()
      .then(setBlockHeight)
      .catch(console.error)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const height = await refreshBlockHeight()
      setBlockHeight(height)
    } catch (error) {
      console.error("[BlockHeightDisplay] Error refreshing:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Block:</span>
        <span className="font-mono font-medium">{formatBlockHeight(blockHeight)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
      <div className="text-sm text-muted-foreground">Current Block Height</div>
      <div className="text-3xl font-bold font-mono">{formatBlockHeight(blockHeight)}</div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="mt-2 bg-transparent"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  )
}