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
  Wallet,
} from "./wallet"

// ============================================================================
// Program Types
// ============================================================================

export type {
  ProgramType,
  ProgramStatus,
  TransactionType,
  CreateTransaction,
  NTangleTransaction,
  NProcessTransaction,
  RedeemTransaction,
  DeleteTransaction,
  OnChainTransaction,
  Product,
  ProgramMetadata,
  OnChainProgram,
  Program,
  PunchCardStatus,
  PunchCard,
  ProgramCardDisplay,
  BlockHeightInfo,
  ExpirationConfig,
  CustomerTransaction,
  CustomerParticipationSummary,
} from "./program"