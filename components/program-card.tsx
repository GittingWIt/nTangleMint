"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Link from "next/link"
import { CalendarIcon, Users, Trash2, Award, Tag, Settings, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWalletData } from "@/hooks/use-wallet-data"
import { hasJoinedProgram, joinProgram, leaveProgram } from "@/lib/program-participation"
import { debug } from "@/lib/debug"

interface ProgramCardProps {
  program: any
  onDelete?: () => void
  showActions?: boolean
  isMerchantWallet?: boolean
  isProgramOwner?: boolean
}

export function ProgramCard({
  program,
  onDelete,
  showActions = true,
  isMerchantWallet = false,
  isProgramOwner = false,
}: ProgramCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const { walletData } = useWalletData()

  const effectiveIsMerchantWallet = isMerchantWallet || walletData?.type === "merchant"

  useEffect(() => {
    // Check if user has joined this program
    const checkJoinStatus = async () => {
      try {
        const joined = hasJoinedProgram(program.id)
        setIsJoined(joined)
        debug(`Program ${program.id} join status:`, joined)
      } catch (error) {
        console.error("Error checking join status:", error)
      }
    }

    checkJoinStatus()
  }, [program.id])

  // Simple date formatting function
  const formatCardDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "No date"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"

      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const day = date.getDate().toString().padStart(2, "0")
      const year = date.getFullYear().toString()

      return `${month}/${day}/${year}`
    } catch (error) {
      return "Invalid date"
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No expiration"
    return `Expires: ${formatCardDate(dateString)}`
  }

  // Handle delete with confirmation
  const handleDelete = () => {
    if (isDeleting) {
      onDelete?.()
      setIsDeleting(false)
      toast({
        title: "Program deleted",
        description: `${program.name} has been deleted.`,
        variant: "destructive",
      })
    } else {
      setIsDeleting(true)
    }
  }

  // Handle join/leave program
  const handleJoinLeave = async () => {
    try {
      setIsJoining(true)

      let result
      if (isJoined) {
        result = leaveProgram(program.id)
      } else {
        result = joinProgram(program.id)
      }

      if (result.success) {
        setIsJoined(!isJoined)
        toast({
          title: isJoined ? "Left program" : "Joined program",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining/leaving program:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Get program type display name
  const getProgramType = () => {
    if (!program.type) return "Program"

    switch (program.type) {
      case "punch-card":
        return "Punch Card"
      case "coupon-book":
        return "Coupon"
      case "loyalty":
        return "Loyalty Program"
      default:
        return program.type.replace(/-/g, " ")
    }
  }

  // Get program status display name with proper capitalization
  const getStatusDisplay = () => {
    if (!program.status) return "Active"
    return program.status.charAt(0).toUpperCase() + program.status.slice(1).toLowerCase()
  }

  // Get expiration date
  const expirationDate = program.expirationDate || (program.metadata && program.metadata.expirationDate) || null

  // Check if program is expired - simplified logic
  const checkIfExpired = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false

    try {
      const expDate = new Date(dateString)
      const today = new Date()

      // Reset time to compare just dates
      expDate.setHours(23, 59, 59, 999)
      today.setHours(0, 0, 0, 0)

      return expDate < today
    } catch (error) {
      console.error("Error checking expiration:", error)
      return false
    }
  }

  const expired = checkIfExpired(expirationDate)

  const getParticipantCount = () => {
    return program.participants ? program.participants.length : 0
  }

  const isPunchCard = program.type === "punch-card"

  return (
    <div className={`overflow-hidden border rounded-lg ${expired ? "border-red-200 bg-red-50/30" : "border-border"}`}>
      <div className="pb-2 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{program.name}</h3>
            <p className="text-sm text-muted-foreground">{program.description}</p>
          </div>
          {onDelete && isProgramOwner && (
            <button
              className={`p-1 h-auto ${isDeleting ? "text-red-600" : "text-muted-foreground"}`}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="pb-2 px-6">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
              {getProgramType()}
            </span>
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                expired
                  ? "border-transparent bg-red-500 text-white hover:bg-red-600"
                  : program.status === "active"
                    ? "border-transparent bg-green-500 text-white hover:bg-green-600"
                    : "border-transparent bg-gray-500 text-white hover:bg-gray-600"
              }`}
            >
              {expired ? "Expired" : getStatusDisplay()}
            </span>
          </div>

          {expirationDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              <span className={expired ? "text-red-600 font-medium" : ""}>{formatDate(expirationDate)}</span>
            </div>
          )}

          {program.participants && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span>{program.participants.length} participants</span>
            </div>
          )}

          {program.metadata?.discountAmount && (
            <div className="flex items-center font-medium">
              <span>
                {program.metadata.discountType === "percentage"
                  ? `${program.metadata.discountAmount}% off`
                  : `${program.metadata.discountAmount} off`}
              </span>
            </div>
          )}

          {/* Punch card specific UI */}
          {program.type === "punch-card" && program.metadata?.requiredPunches && (
            <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-100">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-amber-800 flex items-center">
                  <Award className="h-4 w-4 mr-1.5" />
                  Punch Card Program
                </div>
                <div className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {program.metadata?.requiredPunches || 5} punches
                </div>
              </div>
              <div className="mt-2 text-sm text-amber-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></div>
                  Reward: {program.metadata?.reward || "Free coffee"}
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></div>
                  Completion Rate: {getParticipantCount() > 0 ? "20%" : "0%"}
                </div>
              </div>
            </div>
          )}

          {!isPunchCard && program.name?.toLowerCase().includes("discount") && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-100">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-emerald-800 flex items-center">
                  <Tag className="h-4 w-4 mr-1.5" />
                  Discount Program
                </div>
                <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {program.discount || "10% off"}
                </div>
              </div>
              <div className="mt-2 text-sm text-emerald-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></div>
                  Product: {program.description?.split(" on ")[1] || "Freeze Dried Strawberries"}
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></div>
                  Usage: {getParticipantCount() > 0 ? `${getParticipantCount()} redemptions` : "No redemptions yet"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm font-medium">{isPunchCard ? "Punch Card" : "Loyalty Program"}</div>
          <div className="flex gap-2">
            {effectiveIsMerchantWallet ? (
              <Link
                href={`/merchant/programs/${program.id}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-1"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Link>
            ) : isJoined ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleJoinLeave}
                disabled={isJoining}
                className="border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
              >
                <Check className="h-4 w-4 mr-1" />
                {isJoining ? "Processing..." : "Joined"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleJoinLeave}
                disabled={isJoining}
                className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                {isJoining ? "Joining..." : "Join Program"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}