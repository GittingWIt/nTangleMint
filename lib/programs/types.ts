// Program Types
export type ProgramType = "loyalty" | "punch-card" | "points" | "tiered" | "coalition" | "coupon-book" | "partnerships"

// Base Interfaces
export interface BaseProgram {
  id: string
  type: ProgramType
  merchantId: string
  businessName: string
  name: string
  description: string
  category?: string
  terms?: string
  isActive: boolean
  participants: string[]
  createdAt: number
  updatedAt: number
}

export interface BaseProgramStats {
  totalParticipants: number
  [key: string]: number | Record<string, number>
}

// Base Actions Interface
export interface ProgramAction<T extends BaseProgram> {
  createProgram: (program: Omit<T, "id" | "createdAt" | "updatedAt" | "type">) => Promise<T>
  updateProgram: (id: string, updates: Partial<T>) => Promise<T>
  deleteProgram: (id: string) => Promise<boolean>
  getProgram: (id: string) => Promise<T | null>
  joinProgram: (programId: string, userId: string) => Promise<boolean>
  leaveProgram: (programId: string, userId: string) => Promise<boolean>
}

// Base Utils Interface
export interface ProgramUtils<T extends BaseProgram, S extends BaseProgramStats = BaseProgramStats> {
  validateProgram: (program: Partial<T>) => boolean
  formatProgramData: (program: T) => any
  getProgramStats: (program: T) => S
  isCouponValid?: (coupon: any) => boolean
}

// Common Types
export interface PointsHistory {
  timestamp: number
  points: number
  reason: string
}

// Loyalty Program Types
export interface LoyaltyUserPoints {
  points: number
  pointsHistory: PointsHistory[]
}

export interface LoyaltyProgram extends BaseProgram {
  type: "loyalty"
  userPoints: {
    [userId: string]: LoyaltyUserPoints
  }
  pointsToReward: number
  pointsPerPurchase: number
  pointsPerDollar: number
  rewardValue: number
}

// Punch Card Program Types
export interface PunchHistory {
  timestamp: number
  location: string | null
}

export interface UserPunchData {
  currentPunches: number
  punchHistory: PunchHistory[]
}

export interface PunchCardProgram extends BaseProgram {
  type: "punch-card"
  punchesData: {
    [userId: string]: UserPunchData
  }
  requiredPunches: number
  rewardDescription: string
  rewardValue: number
}

// Tiered Program Types
export interface Tier {
  id: string
  name: string
  pointsRequired: number
  benefits: string[]
}

export interface TieredUserPoints {
  points: number
  currentTier: string
  pointsHistory: PointsHistory[]
}

export interface TieredProgram extends BaseProgram {
  type: "tiered"
  tiers: Tier[]
  pointsPerDollar: number
  userPoints: {
    [userId: string]: TieredUserPoints
  }
}

// Coupon Book Program Types
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

// Partnerships Program Types
export interface Partner {
  id: string
  name: string
  description: string
  pointsMultiplier: number
  logo?: string
  website?: string
}

export interface PartnershipPointsHistory extends PointsHistory {
  partnerId: string
}

export interface PartnershipUserPoints {
  points: number
  pointsHistory: PartnershipPointsHistory[]
}

export interface PartnershipsProgram extends BaseProgram {
  type: "partnerships"
  partners: Partner[]
  userPoints: {
    [userId: string]: PartnershipUserPoints
  }
  pointsToReward: number
}

// Program-specific Actions
export interface LoyaltyActions {
  addPoints: (programId: string, userId: string, points: number, reason: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPointsBalance: (programId: string, userId: string) => Promise<number>
}

export interface PunchCardActions {
  addPunch: (programId: string, userId: string, location?: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPunchesCount: (programId: string, userId: string) => Promise<number>
}

export interface TieredActions {
  addTier: (programId: string, tier: Omit<Tier, "id">) => Promise<boolean>
  removeTier: (programId: string, tierId: string) => Promise<boolean>
  addPoints: (programId: string, userId: string, points: number, reason: string) => Promise<boolean>
  getUserTier: (programId: string, userId: string) => Promise<Tier | null>
  getPointsToNextTier: (programId: string, userId: string) => Promise<number>
}

export interface CouponBookActions {
  addCoupon: (
    programId: string,
    couponData: Omit<Coupon, "id" | "currentUses" | "createdAt" | "updatedAt">,
  ) => Promise<boolean>
  updateCoupon: (programId: string, couponId: string, updates: Partial<Coupon>) => Promise<boolean>
  removeCoupon: (programId: string, couponId: string) => Promise<boolean>
  redeemCoupon: (programId: string, userId: string, couponId: string) => Promise<boolean>
  getCouponStatus: (programId: string, userId: string, couponId: string) => Promise<UserCoupon | null>
  getCoupons: (programId: string) => Promise<Coupon[]>
  getUserCoupons: (programId: string, userId: string) => Promise<{ coupon: Coupon; status: UserCoupon }[]>
}

export interface PartnershipsActions {
  addPartner: (programId: string, partner: Omit<Partner, "id">) => Promise<boolean>
  removePartner: (programId: string, partnerId: string) => Promise<boolean>
  addPoints: (programId: string, userId: string, points: number, partnerId: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPointsBalance: (programId: string, userId: string) => Promise<number>
}