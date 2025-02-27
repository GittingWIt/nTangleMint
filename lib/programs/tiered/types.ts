import type { BaseProgram, BaseProgramStats } from "../types"

export interface Tier {
  id: string
  name: string
  pointsRequired: number
  benefits: string[]
}

export interface PointsHistory {
  timestamp: number
  points: number
  reason: string
}

export interface UserPoints {
  points: number
  currentTier: string
  pointsHistory: PointsHistory[]
}

export interface TieredProgram extends BaseProgram {
  type: "tiered"
  tiers: Tier[]
  pointsPerDollar: number
  userPoints: {
    [userId: string]: UserPoints
  }
}

export interface UserProgress {
  userId: string
  points: number
  currentTier: string
  nextTier: string
  progress: number
}

export interface FormattedTieredProgram extends Omit<TieredProgram, "userPoints"> {
  userProgress: UserProgress[]
}

export interface TierDistribution {
  [tierName: string]: number
}

export interface TieredProgramStats extends BaseProgramStats {
  totalParticipants: number
  totalPoints: number
  averagePointsPerUser: number
  tierDistribution: TierDistribution
}

export interface TieredActions {
  addTier: (programId: string, tier: Omit<Tier, "id">) => Promise<boolean>
  removeTier: (programId: string, tierId: string) => Promise<boolean>
  addPoints: (programId: string, userId: string, points: number, reason: string) => Promise<boolean>
  getUserTier: (programId: string, userId: string) => Promise<Tier | null>
  getPointsToNextTier: (programId: string, userId: string) => Promise<number>
}