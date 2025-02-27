import type { BaseProgram } from "../types"

export interface PunchHistory {
  timestamp: number
  location: string | null
}

export interface UserPunchData {
  currentPunches: number
  punchHistory: PunchHistory[]
}

export interface PunchCardProgram extends BaseProgram {
  type: "punch-card"
  punchesData: {
    [userId: string]: UserPunchData
  }
  requiredPunches: number
  rewardDescription: string
  rewardValue: number
}

export interface PunchCardActions {
  addPunch: (programId: string, userId: string, location?: string) => Promise<boolean>
  redeemReward: (programId: string, userId: string) => Promise<boolean>
  getPunchesCount: (programId: string, userId: string) => Promise<number>
}

export interface ProgramProgress {
  userId: string
  progress: number
  punches: number
  required: number
}

export interface FormattedPunchCardProgram extends Omit<PunchCardProgram, "punchesData"> {
  progress: ProgramProgress[]
}

export interface ProgramStats {
  totalParticipants: number
  totalPunches: number
  completedRewards: number
  averagePunchesPerUser: number
  [key: string]: number
}