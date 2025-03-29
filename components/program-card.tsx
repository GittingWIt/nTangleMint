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

// Define a more specific type for the metadata
interface ProgramMetadata {
  type?: string
  merchantName?: string
  merchant?: string
  discountAmount?: string | number
  discountType?: string
  expirationDate?: string | Date
  [key: string]: any // Allow for other properties
}

// Extend the Program type to include the more specific metadata type
// and ensure all properties we're using are explicitly defined
interface ExtendedProgram {
  id: string
  name: string
  description: string
  type?: string
  status?: string
  isPublic?: boolean
  merchantAddress: string
  discount?: string
  expirationDate?: string | Date
  participants?: string[]
  stats?: {
    participantCount?: number
    [key: string]: any
  }
  metadata?: ProgramMetadata
  [key: string]: any // Allow for other properties
}

export function ProgramCard({ program, userType, userWalletAddress, onJoin }: ProgramCardProps) {
  // Cast program to ExtendedProgram to use the more specific type
  const typedProgram = program as ExtendedProgram

  const [isJoined, setIsJoined] = useState(false)
  const [isClipped, setIsClipped] = useState(false)
  const [participantCount, setParticipantCount] = useState(getParticipantCount())

  // Check if user is already a participant or has clipped the coupon
  useEffect(() => {
    if (!userWalletAddress) return

    // Check if user is in participants
    const joined =
      Array.isArray(typedProgram.participants) && typedProgram.participants.some((p) => p === userWalletAddress)
    setIsJoined(joined)

    // For coupon-type programs, check if the user has already clipped the coupon
    if (typedProgram.type === "coupon-book" || typedProgram.metadata?.type === "coupon") {
      try {
        const userCouponsKey = `user-coupons-${userWalletAddress}`
        const couponsStr = localStorage.getItem(userCouponsKey) || "[]"
        const userCoupons = JSON.parse(couponsStr)

        // Check if this program's coupon is already clipped
        const clipped = userCoupons.some((c: any) => c.id === typedProgram.id)
        setIsClipped(clipped)

        // If clipped but not joined, update the joined status
        if (clipped && !joined) {
          setIsJoined(true)
        }
      } catch (error) {
        console.error("Error checking clipped coupons:", error)
      }
    }
  }, [typedProgram, userWalletAddress])

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
  const getDiscountInfo = (): string => {
    if (typedProgram.discount) {
      return typedProgram.discount
    }

    // Try to get from metadata
    if (typedProgram.metadata) {
      const { discountAmount, discountType } = typedProgram.metadata
      if (discountAmount && discountType) {
        return discountType === "percentage" ? `${discountAmount}% off` : `$${discountAmount} off`
      }
    }

    return "Special offer"
  }

  // Get merchant name
  const getMerchantName = () => {
    if (typedProgram.metadata?.merchantName) {
      return typedProgram.metadata.merchantName
    }

    if (typedProgram.metadata?.merchant) {
      return typedProgram.metadata.merchant
    }

    // Use a shortened version of the merchant address
    if (typedProgram.merchantAddress) {
      const addr = typedProgram.merchantAddress
      return addr.substring(0, 6) + "..." + addr.substring(addr.length - 4)
    }

    return "Unknown Merchant"
  }

  // Get participant count
  function getParticipantCount() {
    if (typedProgram.stats?.participantCount) {
      return typedProgram.stats.participantCount
    }

    if (Array.isArray(typedProgram.participants)) {
      return typedProgram.participants.length
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
      const updatedParticipants = Array.isArray(typedProgram.participants)
        ? [...typedProgram.participants, userWalletAddress]
        : [userWalletAddress]

      // Update program in storage
      const allPrograms = JSON.parse(localStorage.getItem("programs") || "[]")
      const programIndex = allPrograms.findIndex((p: any) => p.id === typedProgram.id)

      if (programIndex !== -1) {
        allPrograms[programIndex].participants = updatedParticipants
        localStorage.setItem("programs", JSON.stringify(allPrograms))
      }

      // For coupon-book type programs, also clip the coupon
      if ((typedProgram.type === "coupon-book" || typedProgram.metadata?.type === "coupon") && !isClipped) {
        // Dispatch coupon clipped event
        const clipEvent = new CustomEvent("couponClipped", {
          detail: {
            couponId: typedProgram.id,
            userId: userWalletAddress,
            merchantAddress: typedProgram.merchantAddress,
          },
        })
        window.dispatchEvent(clipEvent)
        setIsClipped(true)
        debug(`Dispatched couponClipped event for program ${typedProgram.id}`)
      }

      // Update local state
      setIsJoined(true)
      setParticipantCount(updatedParticipants.length)

      // Show feedback
      alert(`You have successfully joined the ${typedProgram.name} program!`)
    } catch (error) {
      console.error("Error joining program:", error)
      alert("There was an error joining this program. Please try again.")
    }
  }

  // Check if user is the merchant who created this program
  const isCreator = userWalletAddress && userWalletAddress === typedProgram.merchantAddress

  // Check if user can join the program
  const canJoin = userType === "user" && !isCreator && !isJoined && !isClipped

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{typedProgram.name}</CardTitle>
          <Badge className={getStatusColor(typedProgram.status || "active")}>
            {(typedProgram.status || "active").charAt(0).toUpperCase() + (typedProgram.status || "active").slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{typedProgram.description}</CardDescription>
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
              {typedProgram.expirationDate
                ? formatDate(typedProgram.expirationDate)
                : typedProgram.metadata?.expirationDate
                  ? formatDate(typedProgram.metadata.expirationDate)
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
            <Link href={`/merchant/program/${typedProgram.id}`}>
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