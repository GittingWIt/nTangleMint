// Re-export wallet types
export type { WalletData, WalletType, WalletCreationData, WalletRestoreData } from "./wallet"
export { isValidWalletType, isCustomerWallet, isMerchantWallet, createDefaultWalletData } from "./wallet"

// Program types
export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"
export type ProgramStatus = "draft" | "active" | "paused" | "expired" | "cancelled"

export interface Product {
  id: string
  name: string
  description?: string
  price?: string
  imageUrl?: string
  upc?: string
  manufacturer?: string
  createdAt: string
  [key: string]: any
}

export interface ProgramMetadata {
  image?: string
  startDate?: string
  endDate?: string
  terms?: string
  products?: Product[]
  isPublic?: boolean
  discountAmount?: string
  discountType?: "percentage" | "fixed"
  expirationDate?: string
  upcCodes?: string[]
  merchantName?: string
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
  [key: string]: any
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
  version?: number
  previousVersionId?: string
  isPublic: boolean
  allowedParticipants?: string[]
  participants: string[]
  maxParticipants?: number
  perUserLimit?: number
  requiresReceipt?: boolean
  minimumAge?: number
  geographicRestrictions?: string[]
  expirationDate?: string
  discount?: string
  [key: string]: any
}

// Customer transaction types
export interface CustomerTransaction {
  id: string
  type: "join" | "leave" | "progress" | "reward"
  programId: string
  programName: string
  customerAddress: string
  merchantAddress: string
  timestamp: string
  metadata?: any
}

export interface CustomerParticipationSummary {
  totalPrograms: number
  activePrograms: number
  totalRewards: number
  totalProgress: number
  averageCompletion: number
  transactions: CustomerTransaction[]
}