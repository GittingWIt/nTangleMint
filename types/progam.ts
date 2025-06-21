/**
 * Program types for the TangleMint application
 */

// Program type and status enums
export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"
export type ProgramStatus = "draft" | "active" | "paused" | "expired" | "cancelled"

// Product interface
export interface Product {
  id: string
  name: string
  description?: string
  price?: string
  imageUrl?: string
  upc?: string
  manufacturer?: string
  createdAt: string
  [key: string]: any // Allow additional properties
}

// Program statistics
export interface ProgramStats {
  participantCount: number
  rewardsIssued: number
  rewardsRedeemed: number
  totalValue: number
}

// Program metadata
export interface ProgramMetadata {
  // Common metadata
  image?: string
  startDate?: string
  endDate?: string
  terms?: string
  products?: Product[]

  // Coupon Book specific
  discountAmount?: string
  discountType?: "percentage" | "fixed"
  expirationDate?: string
  upcCodes?: string[]
  merchantName?: string

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

  [key: string]: any // Allow additional properties
}

// Main Program interface
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
  version?: number
  previousVersionId?: string

  // Access control
  isPublic: boolean
  allowedParticipants?: string[] // Wallet addresses
  participants: string[]

  // Constraints
  maxParticipants?: number
  perUserLimit?: number

  // Validation rules
  requiresReceipt?: boolean
  minimumAge?: number
  geographicRestrictions?: string[] // ISO country/region codes

  // Additional fields that might be used in the application
  expirationDate?: string
  discount?: string

  [key: string]: any // Allow additional properties
}

// Product attachment interface
export interface ProductAttachment {
  pageId: string
  programId?: string
  name?: string
  products?: Product[]
  [key: string]: any // Allow additional properties
}

// Participant interface
export interface Participant {
  walletAddress: string
  joinedAt: string
  status: "active" | "inactive" | "banned"
  rewards?: any[]
  points?: number
  punches?: number
  tier?: string
  [key: string]: any
}

// Transaction interface for program activities
export interface ProgramTransaction {
  id: string
  programId: string
  participantAddress: string
  type: "join" | "purchase" | "reward" | "redeem" | "punch" | "point"
  amount?: number
  timestamp: string
  metadata?: any
  [key: string]: any
}