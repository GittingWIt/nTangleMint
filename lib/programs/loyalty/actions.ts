"use server"

import type { LoyaltyProgram, LoyaltyActions } from "./types"
import type { ProgramAction } from "../types"
import { revalidatePath } from "next/cache"

interface StorageOperations {
  getPrograms: () => LoyaltyProgram[]
  savePrograms: (programs: LoyaltyProgram[]) => void
  getProgram: (id: string) => LoyaltyProgram | null
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

  savePrograms: (programs: LoyaltyProgram[]) => {
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
      return programs.find((p: LoyaltyProgram) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },
}

export const createLoyaltyActions = () => {
  const createProgram = async (
    program: Omit<LoyaltyProgram, "id" | "createdAt" | "updatedAt" | "type">,
  ): Promise<LoyaltyProgram> => {
    try {
      const newProgram: LoyaltyProgram = {
        ...program,
        type: "loyalty",
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userPoints: {},
        participants: [],
        pointsToReward: program.pointsToReward,
        businessName: program.businessName,
        name: program.name,
        description: program.description,
        category: program.category || "general",
        terms: program.terms || "",
        isActive: program.isActive ?? true,
        merchantId: program.merchantId,
        pointsPerPurchase: program.pointsPerPurchase,
        pointsPerDollar: program.pointsPerDollar,
        rewardValue: program.rewardValue,
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

  const updateProgram = async (id: string, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> => {
    try {
      const programs = storage.getPrograms()
      const index = programs.findIndex((p: LoyaltyProgram) => p.id === id)

      if (index === -1) throw new Error("Program not found")

      const currentProgram = programs[index]
      if (!currentProgram) throw new Error("Program not found")

      const updatedProgram: LoyaltyProgram = {
        ...currentProgram,
        ...updates,
        type: "loyalty",
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
      const filtered = programs.filter((p: LoyaltyProgram) => p.id !== id)
      storage.savePrograms(filtered)
      revalidatePath("/merchant/programs")
      return true
    } catch (error) {
      console.error("Error deleting program:", error)
      return false
    }
  }

  const getProgram = async (id: string): Promise<LoyaltyProgram | null> => {
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

      if (!program.participants.includes(userId)) {
        program.participants.push(userId)
      }

      program.userPoints[userId] = {
        points: 0,
        pointsHistory: [],
      }

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

      program.participants = program.participants.filter((id) => id !== userId)
      delete program.userPoints[userId]

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error leaving program:", error)
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

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding points:", error)
      return false
    }
  }

  const redeemReward = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userData = program.userPoints[userId]
      if (!userData || userData.points < program.pointsToReward) return false

      userData.points -= program.pointsToReward

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error redeeming reward:", error)
      return false
    }
  }

  const getPointsBalance = async (programId: string, userId: string): Promise<number> => {
    try {
      const program = await getProgram(programId)
      if (!program) return 0

      return program.userPoints[userId]?.points || 0
    } catch (error) {
      console.error("Error getting points balance:", error)
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
    addPoints,
    redeemReward,
    getPointsBalance,
  } satisfies ProgramAction<LoyaltyProgram> & LoyaltyActions
}