import type { CouponBookProgram, Coupon } from "./types"
import type { ProgramUtils } from "../types"

interface CouponBookStats {
  totalParticipants: number
  totalCoupons: number
  activeCoupons: number
  totalRedemptions: number
  redemptionsPerUser: number
  [key: string]: number
}

interface FormattedCoupon extends Coupon {
  isExpired: boolean
  isFullyRedeemed: boolean
  availableUses: number
}

interface FormattedCouponBookProgram extends Omit<CouponBookProgram, "coupons"> {
  coupons: FormattedCoupon[]
}

export const couponBookUtils: ProgramUtils<CouponBookProgram> & {
  calculateDiscount: (coupon: Coupon, amount: number) => number
} = {
  validateProgram: (program: Partial<CouponBookProgram>): boolean => {
    if (!program.businessName || !program.name || !program.description) return false
    if (!Array.isArray(program.coupons)) return false

    // Validate each coupon
    return program.coupons.every((coupon: Coupon) => {
      if (!coupon.title || !coupon.description) return false
      if (typeof coupon.discountValue !== "number" || coupon.discountValue <= 0) return false
      if (!["percentage", "fixed"].includes(coupon.discountType)) return false
      if (coupon.discountType === "percentage" && coupon.discountValue > 100) return false
      if (coupon.maxUses !== undefined && (typeof coupon.maxUses !== "number" || coupon.maxUses < 1)) return false
      if (coupon.expiryDate !== undefined && (typeof coupon.expiryDate !== "number" || coupon.expiryDate < Date.now()))
        return false
      return true
    })
  },

  formatProgramData: (program: CouponBookProgram): FormattedCouponBookProgram => {
    return {
      ...program,
      coupons: program.coupons.map((coupon: Coupon): FormattedCoupon => {
        const isExpired = coupon.expiryDate ? Date.now() > coupon.expiryDate : false
        const isFullyRedeemed = coupon.maxUses ? coupon.currentUses >= coupon.maxUses : false
        const availableUses = coupon.maxUses
          ? Math.max(0, coupon.maxUses - coupon.currentUses)
          : Number.POSITIVE_INFINITY

        return {
          ...coupon,
          isExpired,
          isFullyRedeemed,
          availableUses,
        }
      }),
    }
  },

  getProgramStats: (program: CouponBookProgram): CouponBookStats => {
    const totalParticipants = program.participants.length
    const totalCoupons = program.coupons.length
    const totalRedemptions = program.coupons.reduce((sum, coupon) => sum + (coupon.currentUses || 0), 0)

    const activeCoupons = program.coupons.filter((coupon) => {
      const notExpired = !coupon.expiryDate || Date.now() <= coupon.expiryDate
      const notFullyRedeemed = !coupon.maxUses || coupon.currentUses < coupon.maxUses
      return notExpired && notFullyRedeemed && coupon.isActive
    }).length

    return {
      totalParticipants,
      totalCoupons,
      activeCoupons,
      totalRedemptions,
      redemptionsPerUser: totalParticipants ? totalRedemptions / totalParticipants : 0,
    }
  },

  isCouponValid: (coupon: Coupon): boolean => {
    if (!coupon.isActive) return false
    if (coupon.expiryDate && Date.now() > coupon.expiryDate) return false
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return false
    return true
  },

  calculateDiscount: (coupon: Coupon, amount: number): number => {
    if (coupon.discountType === "percentage") {
      return amount * (coupon.discountValue / 100)
    }
    return Math.min(amount, coupon.discountValue)
  },
}