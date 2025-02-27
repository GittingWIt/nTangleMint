import type { PartnershipsProgram, Partner } from "./types"
import type { ProgramUtils } from "../types"

interface PartnerStats extends Partner {
  totalPointsAwarded: number
}

interface UserProgress {
  userId: string
  points: number
  progress: number
  rewardsEarned: number
}

interface FormattedPartnershipsProgram extends Omit<PartnershipsProgram, "partners"> {
  userProgress: UserProgress[]
  partnerStats: PartnerStats[]
}

interface ProgramStats {
  totalParticipants: number
  totalPoints: number
  totalRewardsEarned: number
  averagePointsPerUser: number
  totalPartners: number
  [key: string]: number
}

export const partnershipsUtils: ProgramUtils<PartnershipsProgram> = {
  validateProgram: (program: Partial<PartnershipsProgram>): boolean => {
    if (!program.pointsToReward || program.pointsToReward < 1) return false
    if (!program.businessName || !program.name || !program.description) return false
    if (!Array.isArray(program.partners) || program.partners.length === 0) return false

    // Validate each partner has required fields and valid multiplier
    if (
      program.partners.some((partner) => {
        if (!partner.name || !partner.description) return true
        if (typeof partner.pointsMultiplier !== "number" || partner.pointsMultiplier <= 0) return true
        return false
      })
    )
      return false

    return true
  },

  formatProgramData: (program: PartnershipsProgram): FormattedPartnershipsProgram => {
    const userProgress = Object.entries(program.userPoints).map(([userId, data]) => ({
      userId,
      points: data.points,
      progress: (data.points / program.pointsToReward) * 100,
      rewardsEarned: Math.floor(data.points / program.pointsToReward),
    }))

    const partnerStats = program.partners.map((partner) => ({
      ...partner,
      totalPointsAwarded: Object.values(program.userPoints).reduce(
        (sum, userData) =>
          sum +
          userData.pointsHistory
            .filter((history) => history.partnerId === partner.id)
            .reduce((partnerSum, history) => partnerSum + history.points, 0),
        0,
      ),
    }))

    return {
      ...program,
      userProgress,
      partnerStats,
    }
  },

  getProgramStats: (program: PartnershipsProgram): ProgramStats => {
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
      totalPartners: program.partners.length,
    }
  },
}