import type { BaseProgram } from '../types'

export interface Tier {
  id: string
  name: string
  pointsRequired: number
  benefits: string[]
}

export interface TieredProgram extends BaseProgram {
  type: 'tiered'
  tiers: Tier[]
  pointsPerDollar: number
  userPoints: {
    [userId: string]: {
      points: number
      currentTier: string
      pointsHistory: {
        timestamp: number
        points: number
        reason: string
      }[]
    }
  }
}

export interface TieredActions {
  addTier: (programId: string, tier: Omit<Tier, 'id'>) => boolean
  removeTier: (programId: string, tierId: string) => boolean
  addPoints: (programId: string, userId: string, points: number, reason: string) => boolean
  getUserTier: (programId: string, userId: string) => Tier | null
  getPointsToNextTier: (programId: string, userId: string) => number
}