import type { BaseProgram } from "../types"

export interface PointsHistory {
  timestamp: number
  points: number
  partnerId: string
}

export interface UserPoints {
  points: number
  pointsHistory: PointsHistory[]
}

export interface Partner {
  id: string
  name: string
  description: string
  pointsMultiplier: number
  logo?: string
  website?: string
}

export interface PartnershipsProgram extends BaseProgram {
  type: "partnerships"
  partners: Partner[]
  userPoints: {
    [userId: string]: UserPoints
  }
  pointsToReward: number
}

export interface PartnershipsActions {
  addPartner: (programId: string, partner: Omit<Partner, "id">) => Promise<boolean>
  removePartner: (programId: string, partnerId: string) => Promise<boolean>
  addPoints: (programId: string, userId: string, points: number, partnerId: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPointsBalance: (programId: string, userId: string) => Promise<number>
}