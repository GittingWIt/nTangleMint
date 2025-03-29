"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Program } from "@/types"
import { debug } from "@/lib/debug"

interface ProgramCardProps {
  program: Program
  userType: "user" | "merchant" | null
  userWalletAddress: string | null
  onJoin: () => void
}

export function ProgramCard({ program, userType, userWalletAddress, onJoin }: ProgramCardProps) {
  const [isJoined, setIsJoined] = useState(false)
  const [isClipped, setIsClipped] = useState(false)
  const [participantCount, setParticipantCount] = useState(getParticipantCount())

  // Check if user is already a participant or has clipped the coupon
  useEffect(() => {
    if (!userWalletAddress) return

    // Check if user is in participants
    const joined = Array.isArray(program.participants) && program.participants.some((p) => p === userWalletAddress)
    setIsJoined(joined)

    // For coupon-type programs, check if the user has already clipped the coupon
    if (program.type === "coupon-book" || program.metadata?.type === "coupon") {
      try {
        const userCouponsKey = `user-coupons-${userWalletAddress}`
        const couponsStr = localStorage.getItem(userCouponsKey) || "[]"
        const userCoupons = JSON.parse(couponsStr)

        // Check if this program's coupon is already clipped
        const clipped = userCoupons.some((c: any) => c.id === program.id)
        setIsClipped(clipped)

        // If clipped but not joined, update the joined status
        if (clipped && !joined) {
          setIsJoined(true)
        }
      } catch (error) {
        console.error("Error checking clipped coupons:", error)
      }
    }
  }, [program, userWalletAddress])

  // Format date to readable string
  const formatDate = (date: Date | string) => {
    if (!date) return "No expiration"

    try {
      // Handle different date formats
      const dateObj = typeof date === "string" ? new Date(date) : date instanceof Date ? date : new Date()

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

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Get discount information
  const getDiscountInfo = () => {
    if (program.discount) {
      return program.discount
    }

    // Try to get from metadata
    if (program.metadata) {
      const { discountAmount, discountType } = program.metadata
      if (discountAmount && discountType) {
        return discountType === "percentage" ? `${discountAmount}% off` : `$${discountAmount} off`
      }
    }

    return "Special offer"
  }

  // Get merchant name
  const getMerchantName = () => {
    if (program.metadata?.merchantName) {
      return program.metadata.merchantName
    }

    if (program.metadata?.merchant) {
      return program.metadata.merchant
    }

    // Use a shortened version of the merchant address
    if (program.merchantAddress) {
      const addr = program.merchantAddress
      return addr.substring(0, 6) + "..." + addr.substring(addr.length - 4)
    }

    return "Unknown Merchant"
  }

  // Get participant count
  function getParticipantCount() {
    if (program.stats?.participantCount) {
      return program.stats.participantCount
    }

    if (Array.isArray(program.participants)) {
      return program.participants.length
    }

    return 0
  }

  // Handle joining the program
  const handleJoin = () => {
    if (!userWalletAddress) {
      onJoin()
      return
    }

    try {
      // Add user to program participants
      const updatedParticipants = Array.isArray(program.participants)
        ? [...program.participants, userWalletAddress]
        : [userWalletAddress]

      // Update program in storage
      const allPrograms = JSON.parse(localStorage.getItem("programs") || "[]")
      const programIndex = allPrograms.findIndex((p: any) => p.id === program.id)

      if (programIndex !== -1) {
        allPrograms[programIndex].participants = updatedParticipants
        localStorage.setItem("programs", JSON.stringify(allPrograms))
      }

      // For coupon-book type programs, also clip the coupon
      if ((program.type === "coupon-book" || program.metadata?.type === "coupon") && !isClipped) {
        // Dispatch coupon clipped event
        const clipEvent = new CustomEvent("couponClipped", {
          detail: {
            couponId: program.id,
            userId: userWalletAddress,
            merchantAddress: program.merchantAddress,
          },
        })
        window.dispatchEvent(clipEvent)
        setIsClipped(true)
        debug(`Dispatched couponClipped event for program ${program.id}`)
      }

      // Update local state
      setIsJoined(true)
      setParticipantCount(updatedParticipants.length)

      // Show feedback
      alert(`You have successfully joined the ${program.name} program!`)
    } catch (error) {
      console.error("Error joining program:", error)
      alert("There was an error joining this program. Please try again.")
    }
  }

  // Check if user is the merchant who created this program
  const isCreator = userWalletAddress && userWalletAddress === program.merchantAddress

  // Check if user can join the program
  const canJoin = userType === "user" && !isCreator && !isJoined && !isClipped

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{program.name}</CardTitle>
          <Badge className={getStatusColor(program.status || "active")}>
            {(program.status || "active").charAt(0).toUpperCase() + (program.status || "active").slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{program.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Merchant: {getMerchantName()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              Expires:{" "}
              {program.expirationDate
                ? formatDate(program.expirationDate)
                : program.metadata?.expirationDate
                  ? formatDate(program.metadata.expirationDate)
                  : "No expiration"}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="font-medium">{getDiscountInfo()}</div>
        {canJoin ? (
          <Button variant="default" size="sm" onClick={handleJoin}>
            Join Program
          </Button>
        ) : userType === "merchant" ? (
          <Button variant="outline" size="sm" disabled>
            Merchants Cannot Join
          </Button>
        ) : isCreator ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/merchant/program/${program.id}`}>
              Manage
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : isJoined || isClipped ? (
          <Button variant="outline" size="sm" disabled>
            {isClipped ? "Already Clipped" : "Already Joined"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onJoin}>
            Sign In to Join
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}