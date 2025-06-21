"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coffee, Store, CalendarIcon, Users, Award } from "lucide-react"
import { PunchCardDisplay } from "./punch-card-display"
import { cn } from "@/lib/utils"

interface PunchCardProps {
  program: any
  onJoin?: () => void
  onPunch?: () => void
  canJoin?: boolean
  canPunch?: boolean
}

export function PunchCard({ program, onJoin, onPunch, canJoin = false, canPunch = false }: PunchCardProps) {
  // Initialize with current punches from program metadata if available
  const [currentPunches, setCurrentPunches] = useState(program.metadata?.currentPunches || 0)

  // Handle adding a punch
  const handlePunch = () => {
    // Increment the punch count
    const newPunchCount = currentPunches + 1
    setCurrentPunches(newPunchCount)

    // Call the onPunch callback if provided
    if (onPunch) {
      onPunch()
    }
  }

  // Format date to readable string
  const formatDate = (date: string | null) => {
    if (!date) return "No expiration"

    try {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid date"
    }
  }

  // Get expiration date
  const getExpirationDate = () => {
    if (program.expirationDate) {
      return program.expirationDate
    }

    if (program.metadata?.expirationDate) {
      return program.metadata.expirationDate
    }

    return null
  }

  // Get required punches
  const getRequiredPunches = () => {
    if (program.metadata?.requiredPunches) {
      return program.metadata.requiredPunches
    }

    return 5 // Default
  }

  // Get reward
  const getReward = () => {
    if (program.metadata?.reward) {
      return program.metadata.reward
    }

    return "Free coffee"
  }

  // Check if card is full
  const isCardFull = currentPunches >= getRequiredPunches()

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <Coffee className="mr-2 h-5 w-5 text-amber-700 dark:text-amber-500" />
            {program.name}
          </CardTitle>
          <Badge
            className={cn(
              program.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
            )}
          >
            {program.status?.charAt(0).toUpperCase() + program.status?.slice(1) || "Active"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{program.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 pt-4 flex-grow">
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center text-muted-foreground">
            <Store className="mr-2 h-4 w-4" />
            <span>Merchant: {program.merchantName || "Local Business"}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Expires: {formatDate(getExpirationDate())}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{program.participants?.length || 0} participants</span>
          </div>
        </div>

        <PunchCardDisplay
          requiredPunches={getRequiredPunches()}
          currentPunches={currentPunches}
          expirationDate={getExpirationDate()}
          reward={getReward()}
        />
      </CardContent>
      <CardFooter className="flex justify-between pt-2 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex items-center">
          <Award className="mr-2 h-5 w-5 text-amber-700 dark:text-amber-500" />
          <span className="font-medium">
            {getReward()} after {getRequiredPunches()} punches
          </span>
        </div>

        <div className="flex gap-2">
          {canJoin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onJoin}
              className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              Join Program
            </Button>
          )}

          {canPunch && !isCardFull && (
            <Button
              variant="default"
              size="sm"
              onClick={handlePunch}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Add Punch
            </Button>
          )}

          {isCardFull && (
            <Badge variant="default" className="px-3 py-1 bg-green-100 text-green-800">
              Card Full!
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default PunchCard