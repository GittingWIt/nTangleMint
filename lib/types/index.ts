/**
 * nTangleMint — Authoritative Type Barrel
 *
 * All application types live here or are re-exported through here.
 * Import from "@/lib/types" everywhere — never from sub-paths directly.
 */

// ============================================================================
// Wallet Types (single source of truth in ./wallet)
// ============================================================================

export type {
  WalletType,
  WalletData,
  WalletBalance,
  WalletSession,
  CustomerWallet,
  MerchantWallet,
  Wallet,
} from "./wallet"

export {
  isCustomerWallet,
  isMerchantWallet,
  isValidWalletType,
  isValidWalletID,
  isValidProgramID,
  createDefaultWalletData,
} from "./wallet"

// ============================================================================
// Program Types
// ============================================================================

export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"

/**
 * active   — live on-chain, accepting customers (broadcast at activation)
 * inactive — created locally, not yet activated, no on-chain record
 * deleted  — DELETE record broadcast, no longer accepting customers
 */
export type ProgramStatus = "active" | "inactive" | "deleted"

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
  pricePerPunch?: number
  satoshisPerPunch?: number
  programType?: "accumulation" | "bogo"
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
  /**
   * Unique program identifier. Format: pid_{12-char-base36}. Fixed 16 chars.
   * Generated at createProgram(). Broadcast to blockchain at activateProgram().
   */
  id: string
  /**
   * walletID of the merchant who created this program.
   * Format: wid_{12-char-base36}. Links program permanently to merchant wallet.
   * Included in PROGRAM OP_RETURN at activation.
   */
  walletID: string
  type: ProgramType
  name: string
  description: string
  createdAt: string
  updatedAt: string
  merchantAddress: string
  status: ProgramStatus
  metadata: ProgramMetadata
  isPublic: boolean
  participants: string[]
  maxParticipants?: number
  perUserLimit?: number
  expirationDate?: string
  /** txID of the PROGRAM OP_RETURN broadcast at activation */
  registrationTxid?: string
  /** Block height when program was activated on-chain */
  blockHeight?: number
  /** txID of the DELETE OP_RETURN when program was deleted */
  deletionTxid?: string
  [key: string]: any
}

// ============================================================================
// Punch Card Types
//
// Lifecycle: nTangled → nProcess (×n) → Redeemed
// Unique key: programId + walletID (customer)
// PunchID = txId of each punch transaction (no separate generated ID)
// ============================================================================

/**
 * active   — card is live, customer is earning punches
 * redeemed — reward claimed, program complete for this customer
 * expired  — card expired before redemption
 */
export type PunchCardStatus = "active" | "redeemed" | "expired"

export interface PunchCard {
  /**
   * txId of the nTangled transaction (first purchase = NFT mint).
   * This IS the PunchID — immutable on-chain proof of card creation.
   */
  txId: string
  /** The program this punch card belongs to */
  programId: string
  /** Full program object for display */
  program: Program
  /**
   * walletID of the customer who owns this punch card.
   * Format: wid_{12-char-base36}.
   * Combined with programId, uniquely identifies this punch card on-chain.
   */
  walletID: string
  /** BSV address of the customer (for on-chain queries) */
  customerAddress: string
  /** BSV address of the merchant (for payment routing) */
  merchantAddress: string
  /** Current punch count. Starts at 1 (set by nTangled, the NFT mint event). */
  punches: number
  /** Total punches required to reach Redeemed */
  requiredPunches: number
  /** Reward description (e.g. "Free coffee") */
  reward: string
  /** ISO timestamp of nTangled transaction (card creation) */
  createdAt: string
  /** ISO timestamp of most recent punch */
  updatedAt: string
  /** ISO timestamp when Redeemed transaction was broadcast */
  redeemedAt?: string
  /** Block height at which this card expires (optional) */
  expirationBlockHeight?: number
  status: PunchCardStatus
}

// ============================================================================
// Display / UI Types
// ============================================================================

export interface ProgramCardDisplay {
  program: Program
  merchantName: string
  participantCount: number
  isJoined: boolean
  canManage: boolean
  punchCard?: PunchCard
}

export interface BlockHeightInfo {
  height: number
  timestamp: string
  network: "mainnet" | "testnet"
}

export interface ExpirationConfig {
  expirationBlockHeight: number
  createdAtBlockHeight: number
  estimatedExpirationDate: Date
  estimatedCreationDate: Date
}

// ============================================================================
// Customer Analytics
// ============================================================================

export interface CustomerTransaction {
  txId: string
  type: "nTangled" | "nProcess" | "Redeemed"
  programId: string
  programName: string
  customerAddress: string
  merchantAddress: string
  timestamp: string
}

export interface CustomerParticipationSummary {
  totalPrograms: number
  activePrograms: number
  totalRedeemed: number
  transactions: CustomerTransaction[]
}