import type { BaseProgram } from '../types'

export interface LoyaltyProgram extends BaseProgram {
  type: 'points'
  pointsPerPurchase: number
  pointsPerDollar: number
  pointsToReward: number
  rewardValue: number
  userPoints: {
    [userId: string]: {
      points: number
      pointsHistory: {
        timestamp: number
        points: number
        reason: string
      }[]
    }
  }
}

export interface LoyaltyActions {
  addPoints: (programId: string, userId: string, points: number, reason: string) => boolean
  redeemReward: (programId: string, userId: string) => boolean
  getPointsBalance: (programId: string, userId: string) => number
}