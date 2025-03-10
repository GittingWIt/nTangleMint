export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"

export type ProgramStatus = "draft" | "active" | "paused" | "expired" | "cancelled"

export interface ProgramStats {
  participantCount: number
  rewardsIssued: number
  rewardsRedeemed: number
  totalValue: number
}

export interface ProgramMetadata {
  // Common metadata
  image?: string
  startDate?: string
  endDate?: string
  terms?: string

  // Coupon Book specific
  discountAmount?: string
  discountType?: "percentage" | "fixed"
  expirationDate?: string
  upcCodes?: string[]

  // Punch Card specific
  requiredPunches?: number
  reward?: string

  // Points specific
  pointsPerDollar?: number
  minimumPurchase?: number
  redemptionRatio?: number

  // Tiered specific
  tiers?: {
    name: string
    threshold: number
    benefits: string[]
  }[]

  // Coalition specific
  partnerAddresses?: string[]
  revenueShare?: number
}

export interface Program {
  id: string
  type: ProgramType
  name: string
  description: string
  createdAt: string
  updatedAt: string
  merchantAddress: string
  status: ProgramStatus
  metadata: ProgramMetadata
  stats?: ProgramStats

  // Version control
  version: number
  previousVersionId?: string

  // Access control
  isPublic: boolean
  allowedParticipants?: string[] // Wallet addresses

  // Constraints
  maxParticipants?: number
  perUserLimit?: number

  // Validation rules
  requiresReceipt?: boolean
  minimumAge?: number
  geographicRestrictions?: string[] // ISO country/region codes
}