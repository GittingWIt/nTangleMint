import type { BaseProgram } from '../types'

export interface PunchCardProgram extends BaseProgram {
  type: 'punch-card'
  requiredPunches: number
  reward: {
    description: string
    value: number
  }
  punchesData: {
    [userId: string]: {
      currentPunches: number
      punchHistory: {
        timestamp: number
        location?: string
      }[]
    }
  }
}

export interface PunchCardActions {
  addPunch: (programId: string, userId: string, location?: string) => boolean
  redeemReward: (programId: string, userId: string) => boolean
  getPunchesCount: (programId: string, userId: string) => number
}