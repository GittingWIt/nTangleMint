/**
 * Program Types
 *
 * Authoritative definitions for programs, transactions, and related entities.
 * Programs are immutably recorded on-chain via OP_RETURN broadcasts.
 */

// ============================================================================
// Program Types & Status
// ============================================================================

export type ProgramType = "coupon-book" | "punch-card" | "points" | "tiered" | "coalition"

/**
 * Program Status:
 * - active: Live on-chain, accepting customers (Create transaction broadcast)
 * - inactive: Created locally, not yet activated, no on-chain record
 * - deleted: DELETE transaction broadcast, no longer accepting customers
 */
export type ProgramStatus = "active" | "inactive" | "deleted"

// ============================================================================
// On-Chain Transaction Types (derived from punchIndex)
// ============================================================================

/**
 * nTangle: First punch, card creation (punchIndex=1)
 * nProcess: Subsequent punch, accumulation (1 < punchIndex < requiredPunches)
 * Redeem: Final punch, reward claimed (punchIndex = requiredPunches)
 * Create: Program registration / card creation
 * Delete: Program deletion / removal
 */
export type TransactionType = "Create" | "nTangle" | "nProcess" | "Redeem" | "Delete"

// ============================================================================
// OP_RETURN Transaction Types (typed structures)
// ============================================================================

/**
 * CreateTransaction - Program registration
 * OP_RETURN (15-field structure):
 *   [0]: "nTangleMint"
 *   [1]: "PunchCard" (Program Type)
 *   [2]: "Create" (Transaction Type)
 *   [3]: programID (pid_{12-char-base36})
 *   [4]: BSV TX ID
 *   [5]: requiredPunches
 *   [6]: expirationDays
 *   [7]: reward
 *   [8-14]: Reserved
 */
export interface CreateTransaction {
  transactionType: "Create"
  programID: string
  bsvTxId: string
  requiredPunches: number
  expirationDays: number
  reward: string
  createdAt: string
  creatorAddress: string // Derived from TX signature
}

/**
 * NTangleTransaction - First punch, card creation
 * OP_RETURN (15-field structure):
 *   [0]: "nTangleMint"
 *   [1]: "PunchCard" (Program Type)
 *   [2]: "nTangle" (Transaction Type)
 *   [3]: programID (pid_{12-char-base36})
 *   [4]: BSV TX ID (this IS the PunchID)
 *   [5]: "1" (punchIndex)
 *   [6-14]: Reserved
 */
export interface NTangleTransaction {
  transactionType: "nTangle"
  programID: string
  bsvTxId: string // This IS the PunchID
  punchIndex: number // Always 1 for nTangle
  participantAddress: string // Derived from TX signature
  createdAt: string
}

/**
 * NProcessTransaction - Subsequent punch
 * OP_RETURN (15-field structure):
 *   [0]: "nTangleMint"
 *   [1]: "PunchCard" (Program Type)
 *   [2]: "nProcess" (Transaction Type)
 *   [3]: programID (pid_{12-char-base36})
 *   [4]: BSV TX ID
 *   [5]: empty (punchIndex derived from blockchain)
 *   [6-14]: Reserved
 */
export interface NProcessTransaction {
  transactionType: "nProcess"
  programID: string
  bsvTxId: string
  punchIndex: number // Derived from blockchain count
  participantAddress: string // Derived from TX signature
  createdAt: string
}

/**
 * RedeemTransaction - Final punch, reward claimed
 * OP_RETURN (15-field structure):
 *   [0]: "nTangleMint"
 *   [1]: "PunchCard" (Program Type)
 *   [2]: "Redeem" (Transaction Type)
 *   [3]: programID (pid_{12-char-base36})
 *   [4]: BSV TX ID
 *   [5]: empty (punchIndex derived from blockchain)
 *   [6-14]: Reserved
 */
export interface RedeemTransaction {
  transactionType: "Redeem"
  programID: string
  bsvTxId: string
  punchIndex: number // Equals requiredPunches
  participantAddress: string // Derived from TX signature
  createdAt: string
}

/**
 * DeleteTransaction - Program deletion
 * OP_RETURN (15-field structure):
 *   [0]: "nTangleMint"
 *   [1]: "PunchCard" (Program Type)
 *   [2]: "Delete" (Transaction Type)
 *   [3]: programID (pid_{12-char-base36})
 *   [4]: BSV TX ID
 *   [5-14]: Reserved
 */
export interface DeleteTransaction {
  transactionType: "Delete"
  programID: string
  bsvTxId: string
  creatorAddress: string // Derived from TX signature
  createdAt: string
}

export type OnChainTransaction =
  | CreateTransaction
  | NTangleTransaction
  | NProcessTransaction
  | RedeemTransaction
  | DeleteTransaction

// ============================================================================
// Program Metadata & Main Program Type
// ============================================================================

/**
 * ProgramMetadata - Database-stored program information
 * Lightweight registry: programId, name, creator, verification timestamp
 * Sourced from program-repository.ts
 */
export type ProgramMetadata = {
  programId: string
  programName: string
  creatorAddress: string
  creatorName?: string
  lastSeenOnChain: number
  verifiedOnChain: boolean
}

/**
 * OnChainProgram - Program data derived from blockchain
 * Represents the immutable facts from Create transaction (Fields 0-4, 5-8)
 * All fields are populated by the parser - no optionals
 */
export interface OnChainProgram {
  /** Unique program identifier: pid_{12-char-base36} (Field 3) */
  id: string
  /** Program type from blockchain: PunchCard, Loyalty, Coupon, etc. (Field 1) */
  type: ProgramType
  /** Program name from blockchain OP_RETURN or database */
  name: string
  /** BSV public address of program creator (derived from Create TX signature) */
  creatorAddress: string
  /** TX ID of the Create transaction */
  txId: string
  /** Block height of Create transaction */
  blockHeight: number
  /** ISO timestamp of Create transaction */
  timestamp: number
  /** Total punches required for redemption (Field 5) */
  requiredPunches: number
  /** Expiration window in days (Field 6) */
  expirationDays: number
  /** Reward description (Field 7) */
  reward: string
  /** Type-specific data from Fields 8+ as key-value pairs */
  data?: Record<string, any>
  /** Program metadata from database */
  metadata?: ProgramMetadata
}

/**
 * Program - Application-level program (what the dashboard displays)
 * Returned by program-service: fully validated and hydrated
 */
export interface Program extends OnChainProgram {
  status: ProgramStatus
  participantCount: number
  createdAt: string
  updatedAt: string
  description: string
  isPublic: boolean
  participants: string[]
}

// ============================================================================
// Punch Card Types
// ============================================================================

/**
 * Punch Card Status:
 * - active: Card is live, customer earning punches
 * - redeemed: Reward claimed, program complete for this customer
 * - expired: Card expired before redemption
 */
export type PunchCardStatus = "active" | "redeemed" | "expired"

/**
 * PunchCard - Customer's participation record for a program
 *
 * Lifecycle tracked via on-chain transactions:
 * 1. nTangle: Customer joins, card created (punchIndex=1)
 * 2. nProcess: Additional punches (1 < punchIndex < requiredPunches)
 * 3. Redeem: Final punch, reward claimed (punchIndex = requiredPunches)
 *
 * Unique identifier: programId + participantAddress (combination)
 * PunchID = TX ID of each punch transaction (no separate generated ID)
 */
export interface PunchCard {
  /** TX ID of nTangle transaction (this IS the PunchID - immutable proof of creation) */
  txId: string
  /** Program this card belongs to */
  programId: string
  /** Full program object for display */
  program: Program
  /** BSV public address of card holder (customer) */
  participantAddress: string
  /** Current punch count (starts at 1 from nTangle) */
  punches: number
  /** Total punches required for redemption */
  requiredPunches: number
  /** Reward description */
  reward: string
  /** ISO timestamp of nTangle transaction (card creation) */
  createdAt: string
  /** ISO timestamp of most recent punch transaction */
  updatedAt: string
  /** TX ID of Redeem transaction (when punches >= requiredPunches) */
  completionTxId?: string
  /** ISO timestamp when card reached redeemed status */
  redeemedAt?: string
  /** Block height at expiration (if applicable) */
  expirationBlockHeight?: number
  /** Current card status */
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
  type: TransactionType
  programId: string
  programName: string
  customerAddress: string
  creatorAddress: string
  timestamp: string
}

export interface CustomerParticipationSummary {
  totalPrograms: number
  activePrograms: number
  totalRedeemed: number
  transactions: CustomerTransaction[]
}