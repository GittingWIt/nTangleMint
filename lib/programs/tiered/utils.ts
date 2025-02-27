import type {
  TieredProgram,
  FormattedTieredProgram,
  TieredProgramStats,
  Tier,
  UserProgress,
  TierDistribution,
} from "./types"
import type { ProgramUtils } from "../types"

export const tieredUtils: ProgramUtils<TieredProgram, TieredProgramStats> = {
  validateProgram: (program: Partial<TieredProgram>): boolean => {
    try {
      // Check required fields
      if (!program.pointsPerDollar || program.pointsPerDollar < 0) return false
      if (!program.businessName || !program.name || !program.description) return false
      if (!Array.isArray(program.tiers) || program.tiers.length === 0) return false

      // Validate each tier has required fields
      const validTiers = program.tiers.every((tier: Partial<Tier>) => {
        return (
          typeof tier.id === "string" &&
          typeof tier.name === "string" &&
          typeof tier.pointsRequired === "number" &&
          tier.pointsRequired >= 0 &&
          Array.isArray(tier.benefits)
        )
      })

      if (!validTiers) return false

      // Sort tiers by points required to ensure proper comparison
      const sortedTiers = [...program.tiers].sort((a, b) => a.pointsRequired - b.pointsRequired)

      // Check if tiers are in ascending order with proper null checks
      for (let i = 0; i < sortedTiers.length - 1; i++) {
        const currentTier = sortedTiers[i]
        const nextTier = sortedTiers[i + 1]

        // Both tiers must exist and have valid pointsRequired values
        if (
          !currentTier ||
          !nextTier ||
          typeof currentTier.pointsRequired !== "number" ||
          typeof nextTier.pointsRequired !== "number"
        ) {
          return false
        }

        // Ensure strict ascending order
        if (currentTier.pointsRequired >= nextTier.pointsRequired) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Error validating program:", error)
      return false
    }
  },

  formatProgramData: (program: TieredProgram): FormattedTieredProgram => {
    try {
      const userProgress: UserProgress[] = Object.entries(program.userPoints).map(([userId, data]) => {
        // Find current tier with null check
        const currentTier = program.tiers.find((tier) => tier.id === data.currentTier)
        if (!currentTier) {
          return {
            userId,
            points: data.points,
            currentTier: "None",
            nextTier: "None",
            progress: 0,
          }
        }

        // Find next tier safely
        const sortedTiers = [...program.tiers].sort((a, b) => a.pointsRequired - b.pointsRequired)
        const currentTierIndex = sortedTiers.findIndex((tier) => tier.id === currentTier.id)
        const nextTier = currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null

        // Calculate progress safely
        let progress = 100 // Default to 100% if at max tier
        if (nextTier && currentTier) {
          const pointsForNextTier = nextTier.pointsRequired - currentTier.pointsRequired
          const pointsEarned = data.points - currentTier.pointsRequired
          progress = Math.min(100, Math.max(0, (pointsEarned / pointsForNextTier) * 100))
        }

        return {
          userId,
          points: data.points,
          currentTier: currentTier.name,
          nextTier: nextTier?.name || "Max Tier",
          progress,
        }
      })

      return {
        ...program,
        userProgress,
      }
    } catch (error) {
      console.error("Error formatting program data:", error)
      return {
        ...program,
        userProgress: [],
      }
    }
  },

  getProgramStats: (program: TieredProgram): TieredProgramStats => {
    try {
      const totalParticipants = program.participants.length
      const totalPoints = Object.values(program.userPoints).reduce((sum, data) => sum + data.points, 0)
      const averagePointsPerUser = totalParticipants > 0 ? totalPoints / totalParticipants : 0

      // Calculate tier distribution safely
      const tierDistribution = program.tiers.reduce((acc, tier) => {
        if (tier && tier.name) {
          acc[tier.name] = Object.values(program.userPoints).filter((data) => data.currentTier === tier.id).length
        }
        return acc
      }, {} as TierDistribution)

      return {
        totalParticipants,
        totalPoints,
        averagePointsPerUser,
        tierDistribution,
      }
    } catch (error) {
      console.error("Error getting program stats:", error)
      return {
        totalParticipants: 0,
        totalPoints: 0,
        averagePointsPerUser: 0,
        tierDistribution: {},
      }
    }
  },
}