import type { CouponBookProgram, Coupon } from './types'
import type { ProgramUtils } from '../types'

export const couponBookUtils: ProgramUtils<CouponBookProgram> = {
  validateProgram: (program: Partial<CouponBookProgram>) => {
    if (!program.businessName || !program.name || !program.description) return false
    if (!Array.isArray(program.coupons)) return false
    
    // Validate each coupon
    return program.coupons.every(coupon => {
      if (!coupon.title || !coupon.description) return false
      if (coupon.discountValue <= 0) return false
      if (!['percentage', 'fixed'].includes(coupon.discountType)) return false
      if (coupon.discountType === 'percentage' && coupon.discountValue > 100) return false
      return true
    })
  },

  formatProgramData: (program: CouponBookProgram) => {
    return {
      ...program,
      coupons: program.coupons.map(coupon => ({
        ...coupon,
        isExpired: coupon.expiryDate ? Date.now() > coupon.expiryDate : false,
        isFullyRedeemed: coupon.maxUses ? coupon.currentUses >= coupon.maxUses : false
      }))
    }
  },

  getProgramStats: (program: CouponBookProgram) => {
    const totalParticipants = program.participants.length
    const totalCoupons = program.coupons.length
    const totalRedemptions = program.coupons.reduce(
      (sum, coupon) => sum + coupon.currentUses,
      0
    )
    
    const activeCoupons = program.coupons.filter(coupon => {
      const notExpired = !coupon.expiryDate || Date.now() <= coupon.expiryDate
      const notFullyRedeemed = !coupon.maxUses || coupon.currentUses < coupon.maxUses
      return notExpired && notFullyRedeemed
    }).length

    return {
      totalParticipants,
      totalCoupons,
      activeCoupons,
      totalRedemptions,
      redemptionsPerUser: totalParticipants ? totalRedemptions / totalParticipants : 0
    }
  }
}