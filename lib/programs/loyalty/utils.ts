import type { LoyaltyProgram } from "./types"
import type { ProgramUtils } from "../types"

interface LoyaltyStats {
  totalParticipants: number
  totalPoints: number
  totalRewardsEarned: number
  averagePointsPerUser: number
  [key: string]: number // Add index signature to satisfy ProgramUtils constraint
}

interface FormattedUserProgress {
  userId: string
  points: number
  progress: number
  rewardsEarned: number
}

interface FormattedLoyaltyProgram extends LoyaltyProgram {
  userProgress: FormattedUserProgress[]
}

export const loyaltyUtils: ProgramUtils<LoyaltyProgram> = {
  validateProgram: (program: Partial<LoyaltyProgram>): boolean => {
    if (!program.pointsPerPurchase || program.pointsPerPurchase < 0) return false
    if (!program.pointsPerDollar || program.pointsPerDollar < 0) return false
    if (!program.pointsToReward || program.pointsToReward < 1) return false
    if (!program.rewardValue || program.rewardValue <= 0) return false
    if (!program.businessName || !program.name || !program.description) return false
    return true
  },

  formatProgramData: (program: LoyaltyProgram): FormattedLoyaltyProgram => {
    return {
      ...program,
      userProgress: Object.entries(program.userPoints).map(([userId, data]) => ({
        userId,
        points: data.points,
        progress: (data.points / program.pointsToReward) * 100,
        rewardsEarned: Math.floor(data.points / program.pointsToReward),
      })),
    }
  },

  getProgramStats: (program: LoyaltyProgram): LoyaltyStats => {
    const totalParticipants = program.participants.length
    const totalPoints = Object.values(program.userPoints).reduce((sum, data) => sum + data.points, 0)
    const totalRewardsEarned = Object.values(program.userPoints).reduce(
      (sum, data) => sum + Math.floor(data.points / program.pointsToReward),
      0,
    )

    return {
      totalParticipants,
      totalPoints,
      totalRewardsEarned,
      averagePointsPerUser: totalParticipants ? totalPoints / totalParticipants : 0,
    }
  },
}