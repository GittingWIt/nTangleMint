import type { PunchCardProgram } from './types'
import type { ProgramUtils } from '../types'

export const punchCardUtils: ProgramUtils<PunchCardProgram> = {
  validateProgram: (program: Partial<PunchCardProgram>) => {
    if (!program.requiredPunches || program.requiredPunches < 1) return false
    if (!program.reward || !program.reward.description || program.reward.value < 0) return false
    if (!program.businessName || !program.name || !program.description) return false
    return true
  },

  formatProgramData: (program: PunchCardProgram) => {
    return {
      ...program,
      progress: Object.entries(program.punchesData).map(([userId, data]) => ({
        userId,
        progress: (data.currentPunches / program.requiredPunches) * 100,
        punches: data.currentPunches,
        required: program.requiredPunches
      }))
    }
  },

  getProgramStats: (program: PunchCardProgram) => {
    const totalParticipants = program.participants.length
    const totalPunches = Object.values(program.punchesData).reduce(
      (sum, data) => sum + data.currentPunches,
      0
    )
    const completedRewards = Object.values(program.punchesData).reduce(
      (sum, data) => sum + Math.floor(data.currentPunches / program.requiredPunches),
      0
    )

    return {
      totalParticipants,
      totalPunches,
      completedRewards,
      averagePunchesPerUser: totalParticipants ? totalPunches / totalParticipants : 0
    }
  }
}