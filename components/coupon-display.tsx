"use client"

import { CalendarIcon, Scissors, Store, Users, Ticket } from "lucide-react"
import { formatDisplayDate, isExpired, getRemainingDays } from "@/lib/utils/date-utils"
import { getMerchantName } from "@/lib/merchant-profiles"
import { useEffect, useState } from "react"

interface CouponDisplayProps {
  program: any
}

export function CouponDisplay({ program }: CouponDisplayProps) {
  const [merchantName, setMerchantName] = useState<string>("")

  // Get merchant name on mount
  useEffect(() => {
    if (program.merchantAddress) {
      const name = getMerchantName(program.merchantAddress, "Local Business")
      setMerchantName(name)
    }
  }, [program.merchantAddress])

  // Get discount information
  const getDiscountInfo = () => {
    if (program.discount) {
      return program.discount
    }

    // Try to get from metadata
    if (program.metadata) {
      const { discountAmount, discountType } = program.metadata
      if (discountAmount && discountType) {
        return discountType === "percentage" ? `${discountAmount}%` : `$${discountAmount}`
      }
    }

    return "Special"
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

  // Get participant count
  const getParticipantCount = () => {
    if (program.stats?.participantCount) {
      return program.stats.participantCount
    }

    if (Array.isArray(program.participants)) {
      return program.participants.length
    }

    return 0
  }

  // Generate a coupon code
  const getCouponCode = () => {
    if (program.couponCode) {
      return program.couponCode
    }

    // Generate a code based on the program name
    const nameWords = program.name.split(" ")
    const initials = nameWords.map((word: string) => word.charAt(0).toUpperCase()).join("")
    return `${initials}${Math.floor(1000 + Math.random() * 9000)}`
  }

  const expirationDate = getExpirationDate()
  const isExpiredCoupon = isExpired(expirationDate)
  const remainingDays = getRemainingDays(expirationDate)
  const discountInfo = getDiscountInfo()
  const participantCount = getParticipantCount()

  return (
    <div className="relative border rounded-md overflow-hidden">
      {/* Coupon header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white">
        <h3 className="font-bold text-lg">{program.name}</h3>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            {discountInfo} OFF
          </span>
        </div>
      </div>

      {/* Scissors line */}
      <div className="relative border-t border-dashed border-gray-300 my-1">
        <div className="absolute -top-3 -left-1">
          <Scissors className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Coupon content */}
      <div className="p-3">
        <p className="text-sm text-gray-600 mb-3">{program.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Store className="h-4 w-4 mr-2 text-gray-400" />
            <span>{merchantName}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              Expires: {formatDisplayDate(expirationDate)}
              {isExpiredCoupon ? (
                <span className="text-red-500 ml-2">Expired</span>
              ) : (
                remainingDays <= 30 && <span className="text-orange-500 ml-2">{remainingDays} days left</span>
              )}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </div>

      {/* Coupon footer */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Ticket className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-mono text-gray-700">{getCouponCode()}</span>
          </div>
          <div className="text-sm font-semibold text-gray-700">{discountInfo} OFF</div>
        </div>
      </div>
    </div>
  )
}