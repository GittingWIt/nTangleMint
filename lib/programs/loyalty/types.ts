import type { BaseProgram } from "../types"

export interface PointsHistory {
  timestamp: number
  points: number
  reason: string
}

export interface UserPoints {
  points: number
  pointsHistory: PointsHistory[]
}

export interface LoyaltyProgram extends BaseProgram {
  type: "loyalty"
  userPoints: {
    [userId: string]: UserPoints
  }
  pointsToReward: number
  pointsPerPurchase: number
  pointsPerDollar: number
  rewardValue: number
}

export interface LoyaltyActions {
  addPoints: (programId: string, userId: string, points: number, reason: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPointsBalance: (programId: string, userId: string) => Promise<number>
}