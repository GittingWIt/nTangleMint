export interface WalletData {
  mnemonic?: string
  privateKey: string
  publicKey: string
  publicAddress: string
  type: "user" | "merchant"
  createdAt: string
  updatedAt: string
  path?: string
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
  version: number
  previousVersionId?: string
  isPublic: boolean
  allowedParticipants?: string[]
  maxParticipants?: number
  perUserLimit?: number
  requiresReceipt?: boolean
  minimumAge?: number
  geographicRestrictions?: string[]
}

export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"

export type ProgramStatus = "draft" | "active" | "paused" | "expired" | "cancelled"

export interface ProgramStats {
  participantCount: number
  rewardsIssued: number
  rewardsRedeemed: number
  totalValue: number
}

export interface ProgramMetadata {
  image?: string
  startDate?: string
  endDate?: string
  terms?: string
  discountAmount?: string
  discountType?: "percentage" | "fixed"
  expirationDate?: string
  upcCodes?: string[]
  requiredPunches?: number
  reward?: string
  pointsPerDollar?: number
  minimumPurchase?: number
  redemptionRatio?: number
  tiers?: {
    name: string
    threshold: number
    benefits: string[]
  }[]
  partnerAddresses?: string[]
  revenueShare?: number
}