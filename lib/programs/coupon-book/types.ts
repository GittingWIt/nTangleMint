import type { BaseProgram } from "../types"

export interface Coupon {
  id: string
  title: string
  description: string
  discountValue: number
  discountType: "percentage" | "fixed"
  currentUses: number
  createdAt: number
  updatedAt: number
  expiryDate: number | null
  maxUses: number | null
  terms: string | null
  image: string | null
  upcCodes: string[] | null
  isActive: boolean
}

export interface UserCoupon {
  redeemed: boolean
  redeemedAt: number | null
}

export interface CouponBookProgram extends BaseProgram {
  type: "coupon-book"
  coupons: Coupon[]
  userCoupons: {
    [userId: string]: {
      [couponId: string]: UserCoupon
    }
  }
}

export interface CouponCreateData {
  title: string
  description: string
  discountValue: number
  discountType: "percentage" | "fixed"
  expiryDate?: number | null
  maxUses?: number | null
  terms?: string | null
  image?: string | null
  upcCodes?: string[] | null
  isActive?: boolean
}

export interface CouponUpdateData {
  title?: string
  description?: string
  discountValue?: number
  discountType?: "percentage" | "fixed"
  expiryDate?: number | null
  maxUses?: number | null
  terms?: string | null
  image?: string | null
  upcCodes?: string[] | null
  isActive?: boolean
}

export interface CouponBookActions {
  addCoupon: (programId: string, couponData: CouponCreateData) => Promise<boolean>
  updateCoupon: (programId: string, couponId: string, updates: CouponUpdateData) => Promise<boolean>
  removeCoupon: (programId: string, couponId: string) => Promise<boolean>
  redeemCoupon: (programId: string, userId: string, couponId: string) => Promise<boolean>
  getCouponStatus: (
    programId: string,
    userId: string,
    couponId: string,
  ) => Promise<{ redeemed: boolean; redeemedAt: number | null } | null>
  getCoupons: (programId: string) => Promise<Coupon[]>
  getUserCoupons: (programId: string, userId: string) => Promise<{ coupon: Coupon; status: UserCoupon }[]>
}