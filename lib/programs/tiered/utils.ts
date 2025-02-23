import type { TieredProgram } from './types'
import type { ProgramUtils } from '../types'

export const tieredUtils: ProgramUtils<TieredProgram> = {
  validateProgram: (program: Partial<TieredProgram>) => {
    if (!program.pointsPerDollar || program.pointsPerDollar < 0) return false
    if (!program.businessName || !program.name || !program.description) return false
    if (!Array.isArray(program.tiers) || program.tiers.length === 0) return false
    
    // Ensure tiers are in ascending order
    for (let i = 1; i < program.tiers.length; i++) {
      if (program.tiers[i].pointsRequired <= program.tiers[i-1].pointsRequired) {
        return false
      }
    }
    
    return true
  },

  formatProgramData: (program: TieredProgram) => {
    return {
      ...program,
      userProgress: Object.entries(program.userPoints).map(([userId, data]) => {
        const currentTier = program.tiers.find(tier => tier.id === data.currentTier)
        const nextTier = program.tiers.find(tier => tier.pointsRequired > data.points)
        
        return {
          userId,
          points: data.points,
          currentTier: currentTier?.name || 'None',
          nextTier: nextTier?.name || 'Max Tier',
          progress: nextTier
            ? ((data.points - currentTier!.pointsRequired) / (nextTier.pointsRequired - currentTier!.pointsRequired)) * 100
            : 100
        }
      })
    }
  },

  getProgramStats: (program: TieredProgram) => {
    const totalParticipants = program.participants.length
    const totalPoints = Object.values(program.userPoints).reduce(
      (sum, data) => sum + data.points,
      0
    )
    
    const tierDistribution = program.tiers.reduce((acc, tier) => {
      acc[tier.name] = Object.values(program.userPoints).filter(
        data => data.currentTier === tier.id
      ).length
      return acc
    }, {} as Record<string, number>)

    return {
      totalParticipants,
      totalPoints,
      averagePointsPerUser: totalParticipants ? totalPoints / totalParticipants : 0,
      tierDistribution
    }
  }
}