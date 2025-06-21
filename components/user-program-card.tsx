"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Tag, Coffee, Store, ArrowRight } from "lucide-react"
import { formatDisplayDate, getRemainingDays } from "@/lib/utils/date-utils"
import { PunchCardDisplay } from "@/components/punch-card-display"
import Link from "next/link"

interface UserProgramCardProps {
  program: any
  userWalletAddress: string
}

export function UserProgramCard({ program, userWalletAddress }: UserProgramCardProps) {
  // Get remaining days until expiration
  const remainingDays = getRemainingDays(program.expirationDate)

  // Format expiration date
  const formattedDate = formatDisplayDate(program.expirationDate)

  // Determine if this is a punch card program
  const isPunchCard = program.type === "punch-card"

  // Get current punches (if applicable)
  const [currentPunches, setCurrentPunches] = useState(0)

  useEffect(() => {
    // Load user's punch count for this program
    if (isPunchCard && userWalletAddress) {
      try {
        const userPunchesKey = `user-punches-${userWalletAddress}-${program.id}`
        const punchesStr = localStorage.getItem(userPunchesKey)
        if (punchesStr) {
          const punches = JSON.parse(punchesStr)
          setCurrentPunches(punches.count || 0)
        }
      } catch (error) {
        console.error("Error loading punch count:", error)
      }
    }
  }, [isPunchCard, program.id, userWalletAddress])

  // Determine program type icon
  const getProgramIcon = () => {
    switch (program.type) {
      case "punch-card":
        return <Coffee className="h-5 w-5 text-amber-500" />
      case "coupon-book":
        return <Tag className="h-5 w-5 text-emerald-500" />
      case "points":
        return <Badge className="h-5 w-5 text-purple-500" />
      default:
        return <Tag className="h-5 w-5 text-primary" />
    }
  }

  // Get program type display name
  const getProgramTypeDisplay = () => {
    switch (program.type) {
      case "punch-card":
        return "Punch Card Program"
      case "coupon-book":
        return "Discount Program"
      case "points":
        return "Points Program"
      default:
        return "Loyalty Program"
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getProgramIcon()}
            <span className="font-medium">{program.name}</span>
          </div>
          <Badge variant={program.status === "active" ? "default" : "secondary"}>
            {program.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{program.description}</p>

        <div className="flex items-center gap-2 mb-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Merchant: {program.merchantName || "Unknown Merchant"}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Expires: {formattedDate}</span>
          {remainingDays !== null && remainingDays < 30 && (
            <Badge variant="outline" className="text-xs">
              {remainingDays} days left
            </Badge>
          )}
        </div>

        {/* Punch card display for punch card programs */}
        {isPunchCard && program.metadata?.requiredPunches && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Punch Progress</h4>
              <span className="text-sm text-amber-700">
                {currentPunches} of {program.metadata.requiredPunches} collected
              </span>
            </div>
            <PunchCardDisplay
              requiredPunches={program.metadata.requiredPunches}
              currentPunches={currentPunches}
              reward={program.metadata.reward || "Free item"}
            />
          </div>
        )}

        {/* Coupon details for coupon programs */}
        {program.type === "coupon-book" && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Discount Offer</h4>
              <Badge variant="outline" className="bg-emerald-100">
                {program.metadata?.discountType === "percentage"
                  ? `${program.metadata.discountAmount}% off`
                  : `$${program.metadata.discountAmount} off`}
              </Badge>
            </div>
            <p className="text-sm mt-2">Product: {program.metadata?.product || "Any purchase"}</p>
            <p className="text-sm mt-1">Usage: {program.metadata?.usageCount || 0} redemptions</p>
          </div>
        )}

        {/* Points details for points programs */}
        {program.type === "points" && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Points Balance</h4>
              <Badge variant="outline" className="bg-purple-100">
                {program.metadata?.currentPoints || 0} points
              </Badge>
            </div>
            <p className="text-sm mt-2">
              Next Reward: {program.metadata?.nextReward || "N/A"} at {program.metadata?.nextRewardPoints || "N/A"}{" "}
              points
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{getProgramTypeDisplay()}</span>
        <Link href={`/user/program/${program.id}`}>
          <Button variant="outline" size="sm" className="gap-1">
            Manage
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}