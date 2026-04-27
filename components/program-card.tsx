"use client"

import { cn } from "@/lib/utils"
import type { Program, PunchCard } from "@/lib/types"
import { Star, Users, Gift, ArrowRight, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Flip3DCard } from "@/components/punch-card/flip-3d-card"

interface ProgramCardProps {
  program: Program
  canManage: boolean
  isJoined: boolean
  punchCard?: PunchCard
  onJoin?: () => void
  onManage?: () => void
  className?: string
}

function calculateGridLayout(totalBlocks: number) {
  if (totalBlocks <= 4) return { columns: totalBlocks, rows: 1 }
  if (totalBlocks <= 6) return { columns: 3, rows: Math.ceil(totalBlocks / 3) }
  if (totalBlocks <= 8) return { columns: 4, rows: Math.ceil(totalBlocks / 4) }
  if (totalBlocks <= 10) return { columns: 5, rows: Math.ceil(totalBlocks / 5) }
  return { columns: 6, rows: Math.ceil(totalBlocks / 6) }
}

function formatTimeRemaining(expirationDate: string | null | undefined): string {
  if (!expirationDate) return "No expiration"
  
  try {
    const expDate = new Date(expirationDate)
    const now = new Date()
    
    if (expDate <= now) return "Expired"
    
    const diffMs = expDate.getTime() - now.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    const diffMonths = Math.floor(diffDays / 30)
    
    if (diffHours < 1) return "Less than 1h left"
    if (diffHours < 24) return `~${diffHours}h left`
    if (diffDays === 1) return "~1 day left"
    if (diffDays < 30) return `~${diffDays} days left`
    if (diffMonths === 1) return "~1 month left"
    return `~${diffMonths} months left`
  } catch (error) {
    console.error("[v0] Error parsing expiration date:", error)
    return "No expiration"
  }
}

export function ProgramCard({
  program,
  canManage,
  isJoined,
  punchCard,
  onJoin,
  onManage,
  className,
}: ProgramCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  // Extract program data
  const totalPunchBlocks = program.metadata?.requiredPunches || 6
  const rewardDescription = program.metadata?.reward || "Free reward"
  const expirationDate = program.metadata?.expirationDate
  const isExpired = expirationDate ? new Date(expirationDate) <= new Date() : false

  const layout = calculateGridLayout(totalPunchBlocks)

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border shadow-sm overflow-hidden",
        "hover:shadow-md transition-shadow duration-200",
        "flex flex-col h-full",
        isExpired && "opacity-60",
        className,
      )}
    >
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-foreground text-lg">{program.name}</h3>
        <p className="text-sm text-muted-foreground">{program.description}</p>
      </div>

      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="grid gap-1.5 mx-auto mb-auto" style={{
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          maxWidth: `${layout.columns * 24 + (layout.columns - 1) * 6}px`,
        }}>
          {Array.from({ length: totalPunchBlocks }).map((_, i) => {
            const isFirst = i === 0
            const isLast = i === totalPunchBlocks - 1
            const currentPunches = program.punchCard?.punches || 0
            const isFilled = i < currentPunches
            
            return (
              <div
                key={i}
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                  isFilled && "bg-primary border-primary text-primary-foreground",
                  !isFilled && isFirst && "bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-600",
                  !isFilled && isLast && "bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600",
                  !isFilled && !isFirst && !isLast && "bg-muted border-muted-foreground/20",
                )}
                title={isFirst ? "nTwined Block" : isLast ? "Redeemable Block" : `Block ${i + 1}`}
              >
                {isFilled && <span className="text-[10px] font-bold">✓</span>}
                {!isFilled && isFirst && <span className="text-[10px] font-bold text-emerald-600">✓</span>}
                {!isFilled && isLast && <span className="text-[10px] font-bold text-amber-600">★</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
          <span>nTwined</span>
        </div>
        <div className="w-px h-3 bg-muted-foreground/20" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
          <span>Redeemable</span>
        </div>
      </div>

      <div className="px-4 py-2 flex-grow flex flex-col">
        <p className="text-sm text-foreground mb-1 line-clamp-3 h-12">{program.description}</p>
        <p className="text-xs text-muted-foreground mt-auto">
          {totalPunchBlocks} punches for reward
        </p>
      </div>

      <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20">
        <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
          <Gift className="w-4 h-4 inline mr-1" />
          {rewardDescription}
        </p>
      </div>

      <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{punchCard ? "Joined" : "Available"}</span>
        </div>
        <div className={cn(isExpired && "text-red-500")}>
          {formatTimeRemaining(expirationDate)}
        </div>
      </div>

      <div className="p-3 pt-0 mt-auto">
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={onManage}
            disabled={isExpired}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Program
          </Button>
        ) : isJoined ? (
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onJoin}
            disabled
          >
            ✓ Joined - Earning Rewards
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              "w-full",
              isExpired ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90",
            )}
            onClick={onJoin}
            disabled={isExpired}
          >
            {isExpired ? "Expired" : "Join Program"}
            {!isExpired && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  )
}