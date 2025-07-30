"use client"

import { CalendarIcon, Scissors, Store, Ticket } from "lucide-react"
import { formatDisplayDate, isExpired, getRemainingDays } from "@/lib/utils/date-utils"
import { getMerchantName } from "@/app/(protected)/merchant/profile-actions"
import { useEffect, useState } from "react"

interface CouponDisplayProps {
  coupon: {
    id: string
    title: string
    description: string
    discount: string
    expiryDate: string
    merchantWallet: string
    isUsed?: boolean
    usedDate?: string
    terms?: string
    category?: string
  }
  onUse?: (couponId: string) => void
  showUseButton?: boolean
  compact?: boolean
}

export function CouponDisplay({ coupon, onUse, showUseButton = true, compact = false }: CouponDisplayProps) {
  const [merchantName, setMerchantName] = useState<string>("Loading...")
  const expired = isExpired(coupon.expiryDate)
  const remainingDays = getRemainingDays(coupon.expiryDate)

  useEffect(() => {
    async function fetchMerchantName() {
      const name = await getMerchantName(coupon.merchantWallet)
      setMerchantName(name)
    }
    fetchMerchantName()
  }, [coupon.merchantWallet])

  const handleUse = () => {
    if (onUse && !coupon.isUsed && !expired) {
      onUse(coupon.id)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 ${
        coupon.isUsed
          ? "opacity-60 bg-gray-50"
          : expired
            ? "opacity-70 bg-red-50 border-red-200"
            : "hover:border-blue-400"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Ticket className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-blue-600`} />
          <div>
            <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm" : "text-base"}`}>{coupon.title}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Store className="h-3 w-3" />
              <span>{merchantName}</span>
            </div>
          </div>
        </div>

        <div className={`text-right ${compact ? "text-lg" : "text-xl"} font-bold text-green-600`}>
          {coupon.discount}
        </div>
      </div>

      {/* Description */}
      {!compact && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{coupon.description}</p>}

      {/* Status and Expiry */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Expires {formatDisplayDate(coupon.expiryDate)}</span>
          </div>
          {!expired && remainingDays <= 7 && (
            <span className="text-orange-600 font-medium">{remainingDays} days left</span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {coupon.isUsed && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              Used {coupon.usedDate ? formatDisplayDate(coupon.usedDate) : ""}
            </span>
          )}
          {expired && !coupon.isUsed && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">Expired</span>
          )}
          {!expired && !coupon.isUsed && (
            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">Active</span>
          )}
        </div>
      </div>

      {/* Terms */}
      {coupon.terms && !compact && (
        <div className="text-xs text-gray-400 mb-3 border-t pt-2">
          <strong>Terms:</strong> {coupon.terms}
        </div>
      )}

      {/* Use Button */}
      {showUseButton && !coupon.isUsed && !expired && (
        <button
          onClick={handleUse}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${
            compact ? "py-2 text-sm" : "py-2.5"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Scissors className="h-4 w-4" />
            Use Coupon
          </div>
        </button>
      )}
    </div>
  )
}