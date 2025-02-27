"use server"

import type { TieredProgram, TieredActions, Tier, UserPoints } from "./types"
import type { ProgramAction } from "../types"
import { revalidatePath } from "next/cache"

interface StorageOperations {
  getPrograms: () => TieredProgram[]
  savePrograms: (programs: TieredProgram[]) => void
  getProgram: (id: string) => TieredProgram | null
}

const storage: StorageOperations = {
  getPrograms: () => {
    try {
      if (typeof window !== "undefined") {
        const programs = localStorage.getItem("programs")
        return programs ? JSON.parse(programs) : []
      }
      return []
    } catch (error) {
      console.error("Error getting programs:", error)
      return []
    }
  },

  savePrograms: (programs: TieredProgram[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("programs", JSON.stringify(programs))
      }
    } catch (error) {
      console.error("Error saving programs:", error)
      throw new Error("Failed to save programs")
    }
  },

  getProgram: (id: string) => {
    try {
      const programs = storage.getPrograms()
      return programs.find((p: TieredProgram) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },
}

export const createTieredActions = () => {
  const createProgram = async (
    program: Omit<TieredProgram, "id" | "createdAt" | "updatedAt" | "type">,
  ): Promise<TieredProgram> => {
    try {
      const newProgram: TieredProgram = {
        ...program,
        type: "tiered",
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tiers: program.tiers || [],
        userPoints: {},
        participants: [],
      }

      const programs = storage.getPrograms()
      programs.push(newProgram)
      storage.savePrograms(programs)
      revalidatePath("/merchant/programs")

      return newProgram
    } catch (error) {
      console.error("Error creating program:", error)
      throw new Error("Failed to create program")
    }
  }

  const updateProgram = async (id: string, updates: Partial<TieredProgram>): Promise<TieredProgram> => {
    try {
      const programs = storage.getPrograms()
      const index = programs.findIndex((p: TieredProgram) => p.id === id)

      if (index === -1) throw new Error("Program not found")

      const currentProgram = programs[index]
      if (!currentProgram) throw new Error("Program not found")

      const updatedProgram: TieredProgram = {
        ...currentProgram,
        ...updates,
        type: "tiered",
        updatedAt: Date.now(),
      }

      programs[index] = updatedProgram
      storage.savePrograms(programs)
      revalidatePath("/merchant/programs")

      return updatedProgram
    } catch (error) {
      console.error("Error updating program:", error)
      throw new Error("Failed to update program")
    }
  }

  const deleteProgram = async (id: string): Promise<boolean> => {
    try {
      const programs = storage.getPrograms()
      const filtered = programs.filter((p: TieredProgram) => p.id !== id)
      storage.savePrograms(filtered)
      revalidatePath("/merchant/programs")
      return true
    } catch (error) {
      console.error("Error deleting program:", error)
      return false
    }
  }

  const getProgram = async (id: string): Promise<TieredProgram | null> => {
    try {
      return storage.getProgram(id)
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  }

  const joinProgram = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      // Ensure program has at least one tier before proceeding
      const firstTier = program.tiers[0]
      if (!firstTier) {
        console.error("Program has no tiers")
        return false
      }

      if (!program.participants.includes(userId)) {
        program.participants.push(userId)
      }

      const initialUserPoints: UserPoints = {
        points: 0,
        currentTier: firstTier.id,
        pointsHistory: [],
      }

      program.userPoints[userId] = initialUserPoints

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error joining program:", error)
      return false
    }
  }

  const leaveProgram = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      program.participants = program.participants.filter((participantId: string) => participantId !== userId)
      delete program.userPoints[userId]

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error leaving program:", error)
      return false
    }
  }

  const addTier = async (programId: string, tier: Omit<Tier, "id">): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const newTier: Tier = {
        ...tier,
        id: crypto.randomUUID(),
      }

      program.tiers.push(newTier)
      program.tiers.sort((a, b) => a.pointsRequired - b.pointsRequired)

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding tier:", error)
      return false
    }
  }

  const removeTier = async (programId: string, tierId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      program.tiers = program.tiers.filter((t) => t.id !== tierId)
      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error removing tier:", error)
      return false
    }
  }

  const addPoints = async (programId: string, userId: string, points: number, reason: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userData = program.userPoints[userId]
      if (!userData) return false

      userData.points += points
      userData.pointsHistory.push({
        timestamp: Date.now(),
        points,
        reason,
      })

      // Update user's tier if necessary
      const newTier = program.tiers.filter((tier) => tier.pointsRequired <= userData.points).pop()

      if (newTier && newTier.id !== userData.currentTier) {
        userData.currentTier = newTier.id
      }

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding points:", error)
      return false
    }
  }

  const getUserTier = async (programId: string, userId: string): Promise<Tier | null> => {
    try {
      const program = await getProgram(programId)
      if (!program) return null

      const userData = program.userPoints[userId]
      if (!userData) return null

      return program.tiers.find((tier) => tier.id === userData.currentTier) || null
    } catch (error) {
      console.error("Error getting user tier:", error)
      return null
    }
  }

  const getPointsToNextTier = async (programId: string, userId: string): Promise<number> => {
    try {
      const program = await getProgram(programId)
      if (!program) return 0

      const userData = program.userPoints[userId]
      if (!userData) return 0

      const nextTier = program.tiers.find((tier) => tier.pointsRequired > userData.points)
      if (!nextTier) return 0

      return nextTier.pointsRequired - userData.points
    } catch (error) {
      console.error("Error getting points to next tier:", error)
      return 0
    }
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addTier,
    removeTier,
    addPoints,
    getUserTier,
    getPointsToNextTier,
  } satisfies ProgramAction<TieredProgram> & TieredActions
}