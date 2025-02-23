import type { BaseProgram } from '../types'

export interface Partner {
  id: string
  name: string
  pointsMultiplier: number
}

export interface PartnershipsProgram extends BaseProgram {
  type: 'coalition'
  partners: Partner[]
  pointsPerDollar: number
  pointsToReward: number
  rewardValue: number
  userPoints: {
    [userId: string]: {
      points: number
      pointsHistory: {
        timestamp: number
        points: number
        partnerId: string
      }[]
    }
  }
}

export interface PartnershipsActions {
  addPartner: (programId: string, partner: Omit<Partner, 'id'>) => boolean
  removePartner: (programId: string, partnerId: string) => boolean
  addPoints: (programId: string, userId: string, points: number, partnerId: string) => boolean
  redeemReward: (programId: string, userId: string) => boolean
  getPointsBalance: (programId: string, userId: string) => number
}