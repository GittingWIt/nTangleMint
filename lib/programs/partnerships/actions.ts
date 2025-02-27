"use server"

import type { PartnershipsProgram, PartnershipsActions, Partner } from "./types"
import type { ProgramAction } from "../types"
import { revalidatePath } from "next/cache"

interface StorageOperations {
  getPrograms: () => PartnershipsProgram[]
  savePrograms: (programs: PartnershipsProgram[]) => void
  getProgram: (id: string) => PartnershipsProgram | null
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

  savePrograms: (programs: PartnershipsProgram[]) => {
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
      return programs.find((p: PartnershipsProgram) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },
}

export const createPartnershipsActions = (): ProgramAction<PartnershipsProgram> & PartnershipsActions => {
  const createProgram = async (
    program: Omit<PartnershipsProgram, "id" | "createdAt" | "updatedAt" | "type">,
  ): Promise<PartnershipsProgram> => {
    try {
      const newProgram: PartnershipsProgram = {
        ...program,
        type: "partnerships",
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        partners: program.partners ?? [],
        userPoints: program.userPoints ?? {},
        participants: program.participants ?? [],
        isActive: program.isActive ?? true,
        merchantId: program.merchantId,
        businessName: program.businessName,
        name: program.name,
        description: program.description,
        category: program.category ?? "general",
        terms: program.terms ?? "",
        pointsToReward: program.pointsToReward,
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

  const updateProgram = async (id: string, updates: Partial<PartnershipsProgram>): Promise<PartnershipsProgram> => {
    try {
      const programs = storage.getPrograms()
      const index = programs.findIndex((p: PartnershipsProgram) => p.id === id)

      if (index === -1) throw new Error("Program not found")

      const currentProgram = programs[index]
      if (!currentProgram) throw new Error("Program not found")

      const updatedProgram: PartnershipsProgram = {
        ...currentProgram,
        ...updates,
        type: "partnerships",
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
      const filtered = programs.filter((p: PartnershipsProgram) => p.id !== id)
      storage.savePrograms(filtered)
      revalidatePath("/merchant/programs")
      return true
    } catch (error) {
      console.error("Error deleting program:", error)
      return false
    }
  }

  const getProgram = async (id: string): Promise<PartnershipsProgram | null> => {
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

      program.participants.push(userId)
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

      program.participants = program.participants.filter((participantId: string) => participantId !== userId)
      delete program.userPoints[userId]

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error leaving program:", error)
      return false
    }
  }

  const addPartner = async (programId: string, partner: Omit<Partner, "id">): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const newPartner: Partner = {
        ...partner,
        id: crypto.randomUUID(),
      }

      program.partners.push(newPartner)
      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding partner:", error)
      return false
    }
  }

  const removePartner = async (programId: string, partnerId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      program.partners = program.partners.filter((p: Partner) => p.id !== partnerId)
      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error removing partner:", error)
      return false
    }
  }

  const addPoints = async (programId: string, userId: string, points: number, partnerId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userData = program.userPoints[userId]
      if (!userData) return false

      const partner = program.partners.find((p: Partner) => p.id === partnerId)
      if (!partner) return false

      const adjustedPoints = points * partner.pointsMultiplier

      userData.points += adjustedPoints
      userData.pointsHistory.push({
        timestamp: Date.now(),
        points: adjustedPoints,
        partnerId,
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

  const actions = {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addPartner,
    removePartner,
    addPoints,
    redeemReward,
    getPointsBalance,
  }

  return actions
}