"use server"

import type { PunchCardProgram, PunchCardActions, UserPunchData } from "./types"
import type { ProgramAction } from "../types"
import { revalidatePath } from "next/cache"

interface StorageOperations {
  getPrograms: () => PunchCardProgram[]
  savePrograms: (programs: PunchCardProgram[]) => void
  getProgram: (id: string) => PunchCardProgram | null
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

  savePrograms: (programs: PunchCardProgram[]) => {
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
      return programs.find((p: PunchCardProgram) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },
}

export const createPunchCardActions = () => {
  const createProgram = async (
    program: Omit<PunchCardProgram, "id" | "createdAt" | "updatedAt" | "type">,
  ): Promise<PunchCardProgram> => {
    try {
      const newProgram: PunchCardProgram = {
        ...program,
        type: "punch-card",
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        punchesData: {},
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

  const updateProgram = async (id: string, updates: Partial<PunchCardProgram>): Promise<PunchCardProgram> => {
    try {
      const programs = storage.getPrograms()
      const index = programs.findIndex((p: PunchCardProgram) => p.id === id)

      if (index === -1) throw new Error("Program not found")

      const currentProgram = programs[index]
      if (!currentProgram) throw new Error("Program not found")

      const updatedProgram: PunchCardProgram = {
        ...currentProgram,
        ...updates,
        type: "punch-card",
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
      const filtered = programs.filter((p: PunchCardProgram) => p.id !== id)
      storage.savePrograms(filtered)
      revalidatePath("/merchant/programs")
      return true
    } catch (error) {
      console.error("Error deleting program:", error)
      return false
    }
  }

  const getProgram = async (id: string): Promise<PunchCardProgram | null> => {
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

      const newUserData: UserPunchData = {
        currentPunches: 0,
        punchHistory: [],
      }

      program.punchesData[userId] = newUserData

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
      delete program.punchesData[userId]

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error leaving program:", error)
      return false
    }
  }

  const addPunch = async (programId: string, userId: string, location?: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userData = program.punchesData[userId]
      if (!userData) return false

      userData.currentPunches++
      userData.punchHistory.push({
        timestamp: Date.now(),
        location: location ?? null,
      })

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding punch:", error)
      return false
    }
  }

  const redeemReward = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userData = program.punchesData[userId]
      if (!userData || userData.currentPunches < program.requiredPunches) return false

      userData.currentPunches -= program.requiredPunches

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error redeeming reward:", error)
      return false
    }
  }

  const getPunchesCount = async (programId: string, userId: string): Promise<number> => {
    try {
      const program = await getProgram(programId)
      if (!program) return 0

      return program.punchesData[userId]?.currentPunches || 0
    } catch (error) {
      console.error("Error getting punches count:", error)
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
    addPunch,
    redeemReward,
    getPunchesCount,
  } satisfies ProgramAction<PunchCardProgram> & PunchCardActions
}