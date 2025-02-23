import type { PartnershipsProgram } from './types'
import type { ProgramUtils } from '../types'

export const partnershipsUtils: ProgramUtils<PartnershipsProgram> = {
  validateProgram: (program: Partial<PartnershipsProgram>) => {
    if (!program.pointsPerDollar || program.pointsPerDollar < 0) return false
    if (!program.pointsToReward || program.pointsToReward < 1) return false
    if (!program.rewardValue || program.rewardValue <= 0) return false
    if (!program.businessName || !program.name || !program.description) return false
    if (!Array.isArray(program.partners) || program.partners.length === 0) return false
    return true
  },

  formatProgramData: (program: PartnershipsProgram) => {
    return {
      ...program,
      userProgress: Object.entries(program.userPoints).map(([userId, data]) => ({
        userId,
        points: data.points,
        progress: (data.points / program.pointsToReward) * 100,
        rewardsEarned: Math.floor(data.points / program.pointsToReward)
      })),
      partnerStats: program.partners.map(partner => ({
        ...partner,
        totalPointsAwarded: Object.values(program.userPoints).reduce(
          (sum, userData) => sum + userData.pointsHistory
            .filter(history => history.partnerId === partner.id)
            .reduce((partnerSum, history) => partnerSum + history.points, 0),
          0
        )
      }))
    }
  },

  getProgramStats: (program: PartnershipsProgram) => {
    const totalParticipants = program.participants.length
    const totalPoints = Object.values(program.userPoints).reduce(
      (sum, data) => sum + data.points,
      0
    )
    const totalRewardsEarned = Object.values(program.userPoints).reduce(
      (sum, data) => sum + Math.floor(data.points / program.pointsToReward),
      0
    )

    return {
      totalParticipants,
      totalPoints,
      totalRewardsEarned,
      averagePointsPerUser: totalParticipants ? totalPoints / totalParticipants : 0,
      totalPartners: program.partners.length
    }
  }
}