import { STORAGE_KEYS } from "@/lib/constants"
import type { Program, UserParticipation } from "@/types"

// Convert class to object literal to avoid inheritance issues
const programUtils = {
  getAllPrograms(): Program[] {
    if (typeof window === "undefined") return []
    try {
      const programs = localStorage.getItem(STORAGE_KEYS.PROGRAMS)
      return programs ? JSON.parse(programs) : []
    } catch {
      return []
    }
  },

  getMerchantPrograms(merchantAddress: string): Program[] {
    if (typeof window === "undefined") return []
    try {
      const allPrograms = this.getAllPrograms()
      return allPrograms.filter((p) => p.merchant_address === merchantAddress)
    } catch {
      return []
    }
  },

  getUserParticipation(userAddress: string): UserParticipation[] {
    if (typeof window === "undefined") return []
    try {
      const key = `${STORAGE_KEYS.USER_PARTICIPATION}_${userAddress}`
      const participation = localStorage.getItem(key)
      return participation ? JSON.parse(participation) : []
    } catch {
      return []
    }
  },

  addProgram(merchantAddress: string, program: Omit<Program, "id" | "merchant_address">): Program {
    if (typeof window === "undefined") throw new Error("Cannot add program on server side")

    try {
      const programs = this.getAllPrograms()
      const newProgram: Program = {
        ...program,
        id: `program_${Date.now()}`,
        merchant_address: merchantAddress,
        participants: [],
        rewards_claimed: 0,
      }

      programs.push(newProgram)
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs))
      return newProgram
    } catch (err) {
      console.error("Failed to add program:", err)
      throw new Error("Failed to add program")
    }
  },

  joinProgram(programId: string, userAddress: string): boolean {
    try {
      // Get existing participation
      const key = `${STORAGE_KEYS.USER_PARTICIPATION}_${userAddress}`
      const participation = this.getUserParticipation(userAddress)

      // Check if already joined
      if (participation.some((p) => p.programId === programId)) {
        return false
      }

      // Add new participation
      const newParticipation: UserParticipation = {
        programId,
        points: 0,
        punchCount: 0,
        tier: 0,
        joinedAt: new Date().toISOString(),
      }

      participation.push(newParticipation)
      localStorage.setItem(key, JSON.stringify(participation))

      // Update program participants
      const programs = this.getAllPrograms()
      const updatedPrograms = programs.map((p) => {
        if (p.id === programId && !p.participants.includes(userAddress)) {
          return { ...p, participants: [...p.participants, userAddress] }
        }
        return p
      })
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(updatedPrograms))

      return true
    } catch {
      return false
    }
  },

  removeProgram(merchantAddress: string, programId: string): boolean {
    if (typeof window === "undefined") return false

    try {
      const programs = this.getAllPrograms()
      const filteredPrograms = programs.filter((p) => !(p.id === programId && p.merchant_address === merchantAddress))
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(filteredPrograms))
      return true
    } catch {
      return false
    }
  },
}

export { programUtils }