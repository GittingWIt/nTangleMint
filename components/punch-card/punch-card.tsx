"use client"

import { cn } from "@/lib/utils"
import type { PunchCard } from "@/lib/types"
import { Gift, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TERMINOLOGY } from "@/lib/constants"

interface PunchCardComponentProps {
  punchCard: PunchCard
  size?: "sm" | "md" | "lg"
  showStatus?: boolean
  className?: string
}

export function PunchCardComponent({
  punchCard,
  size = "md",
  showStatus = true,
  className,
}: PunchCardComponentProps) {
  const { punches, requiredPunches, program, status } = punchCard
  const completionPercentage = Math.min(100, Math.round((punches / requiredPunches) * 100))
  
  const sizeClasses = {
    sm: "w-48 p-3",
    md: "w-64 p-4",
    lg: "w-80 p-5",
  }
  
  const punchSizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }

  // Generate punch slots
  const slots = Array.from({ length: requiredPunches }, (_, i) => ({
    index: i + 1,
    filled: i < punches,
  }))

  const statusLabel = status === "active" ? TERMINOLOGY.NPROCESS : 
                      status === "completed" ? "Ready to Redeem" :
                      status === "redeemed" ? TERMINOLOGY.REDEEMED : "Expired"

  const statusVariant = status === "active" ? "default" :
                        status === "completed" ? "secondary" :
                        status === "redeemed" ? "outline" : "destructive"

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">{program.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {program.metadata.merchantName || "Local Business"}
          </p>
        </div>
        {showStatus && (
          <Badge variant={statusVariant} className="ml-2 shrink-0">
            {statusLabel}
          </Badge>
        )}
      </div>

      {/* Punch Grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={cn(
              "rounded-full flex items-center justify-center border-2 transition-all",
              punchSizeClasses[size],
              slot.filled
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-muted/50 border-dashed border-muted-foreground/30"
            )}
          >
            {slot.filled ? (
              <Check className="w-3/5 h-3/5" />
            ) : (
              <span className="text-muted-foreground/50">{slot.index}</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress Text */}
      <div className="mb-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {punches} of {requiredPunches} punches
        </p>
      </div>

      {/* Reward */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t">
        <Gift className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{punchCard.reward}</span>
      </div>
    </div>
  )
}