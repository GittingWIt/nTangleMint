import type { BaseProgram } from '../types'

export interface Coupon {
  id: string
  title: string
  description: string
  discountValue: number
  discountType: 'percentage' | 'fixed'
  expiryDate?: number
  maxUses: number
  currentUses: number
  terms?: string
}

export interface CouponBookProgram extends BaseProgram {
  type: 'coupon-book'
  coupons: Coupon[]
  userCoupons: {
    [userId: string]: {
      [couponId: string]: {
        redeemed: boolean
        redeemedAt?: number
      }
    }
  }
}

export interface CouponBookActions {
  addCoupon: (programId: string, coupon: Omit<Coupon, 'id' | 'currentUses'>) => boolean
  removeCoupon: (programId: string, couponId: string) => boolean
  redeemCoupon: (programId: string, userId: string, couponId: string) => boolean
  getCouponStatus: (programId: string, userId: string, couponId: string) => {
    redeemed: boolean
    redeemedAt?: number
  } | null
}