import { debug, debugError } from "./debug"
import { getWalletData, getPrograms, updateProgram, getProgram } from "./storage-compat"

/**
 * Manages user participation in programs with persistent storage
 */
export class ProgramParticipation {
  private static readonly PARTICIPATION_KEY = "user_program_participation"

  /**
   * Get user's participation data
   */
  static getUserParticipation(userAddress: string): {
    joinedPrograms: string[]
    joinDates: Record<string, string>
    progress: Record<string, any>
  } {
    try {
      const key = `${this.PARTICIPATION_KEY}_${userAddress}`
      const data = localStorage.getItem(key)

      if (!data) {
        return {
          joinedPrograms: [],
          joinDates: {},
          progress: {},
        }
      }

      const participation = JSON.parse(data)
      debug(`Retrieved participation data for ${userAddress}:`, participation)

      return {
        joinedPrograms: participation.joinedPrograms || [],
        joinDates: participation.joinDates || {},
        progress: participation.progress || {},
      }
    } catch (error) {
      console.error("Error getting user participation:", error)
      return {
        joinedPrograms: [],
        joinDates: {},
        progress: {},
      }
    }
  }

  /**
   * Save user's participation data
   */
  static saveUserParticipation(
    userAddress: string,
    participation: {
      joinedPrograms: string[]
      joinDates: Record<string, string>
      progress: Record<string, any>
    },
  ): void {
    try {
      const key = `${this.PARTICIPATION_KEY}_${userAddress}`
      localStorage.setItem(key, JSON.stringify(participation))
      debug(`Saved participation data for ${userAddress}:`, participation)
    } catch (error) {
      console.error("Error saving user participation:", error)
    }
  }

  /**
   * Join a program
   */
  static joinProgram(programId: string): { success: boolean; message: string } {
    try {
      const wallet = getWalletData()
      if (!wallet) {
        debug("No wallet data found when joining program")
        return { success: false, message: "No wallet found" }
      }

      const userAddress = wallet.publicAddress
      const program = getProgram(programId)

      if (!program) {
        debug(`Program ${programId} not found when joining`)
        return { success: false, message: "Program not found" }
      }

      // Check if already joined
      if (this.hasJoinedProgram(programId)) {
        debug(`User ${userAddress.substring(0, 8)}... already joined program ${programId}`)
        return { success: false, message: "Already joined this program" }
      }

      // Initialize participants array if it doesn't exist
      const participants = Array.isArray(program.participants) ? [...program.participants] : []

      // Add user to participants
      participants.push(userAddress)

      // Update the program
      updateProgram(programId, { participants })

      debug(`User ${userAddress.substring(0, 8)}... successfully joined program ${programId}`)

      // Dispatch custom event for program joined
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("programJoined", {
            detail: { programId, userAddress },
          }),
        )
      }

      return { success: true, message: "Successfully joined program" }
    } catch (error) {
      debugError("Error joining program:", error)
      return { success: false, message: "Error joining program" }
    }
  }

  /**
   * Leave a program
   */
  static leaveProgram(programId: string): { success: boolean; message: string } {
    try {
      const wallet = getWalletData()
      if (!wallet) {
        debug("No wallet data found when leaving program")
        return { success: false, message: "No wallet found" }
      }

      const userAddress = wallet.publicAddress
      const program = getProgram(programId)

      if (!program) {
        debug(`Program ${programId} not found when leaving`)
        return { success: false, message: "Program not found" }
      }

      // Check if program has participants array
      if (!program.participants || !Array.isArray(program.participants)) {
        debug(`Program ${programId} has no participants array`)
        return { success: false, message: "Not joined this program" }
      }

      // Check if user is a participant
      if (!program.participants.includes(userAddress)) {
        debug(`User ${userAddress.substring(0, 8)}... not in program ${programId} participants`)
        return { success: false, message: "Not joined this program" }
      }

      // Remove user from participants
      const participants = program.participants.filter((addr: string) => addr !== userAddress)

      // Update the program
      updateProgram(programId, { participants })

      debug(`User ${userAddress.substring(0, 8)}... successfully left program ${programId}`)

      // Dispatch custom event for program left
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("programLeft", {
            detail: { programId, userAddress },
          }),
        )
      }

      return { success: true, message: "Successfully left program" }
    } catch (error) {
      debugError("Error leaving program:", error)
      return { success: false, message: "Error leaving program" }
    }
  }

  /**
   * Check if user has joined a program
   */
  static hasJoinedProgram(programId: string): boolean {
    try {
      const wallet = getWalletData()
      if (!wallet) return false

      const userAddress = wallet.publicAddress
      const program = getProgram(programId)

      if (!program) return false

      const hasJoined =
        program.participants && Array.isArray(program.participants) && program.participants.includes(userAddress)

      debug(`User ${userAddress.substring(0, 8)}... has joined program ${programId}: ${hasJoined}`)
      return hasJoined
    } catch (error) {
      console.error("Error checking program participation:", error)
      return false
    }
  }

  /**
   * Get user's joined programs with details
   */
  static getUserJoinedPrograms() {
    try {
      const wallet = getWalletData()
      if (!wallet) {
        debug("No wallet data found when getting joined programs")
        return []
      }

      const userAddress = wallet.publicAddress
      debug(`Getting joined programs for user: ${userAddress.substring(0, 8)}...`)

      const allPrograms = getPrograms()

      // Filter programs where user is a participant
      const joinedPrograms = allPrograms.filter(
        (program: any) =>
          program.participants && Array.isArray(program.participants) && program.participants.includes(userAddress),
      )

      debug(`Found ${joinedPrograms.length} joined programs for user ${userAddress.substring(0, 8)}...`)
      return joinedPrograms
    } catch (error) {
      console.error("Error getting user joined programs:", error)
      return []
    }
  }

  /**
   * Update user progress in a program
   */
  static updateProgress(programId: string, progress: any): void {
    try {
      const wallet = getWalletData()
      if (!wallet) return

      const participation = this.getUserParticipation(wallet.publicAddress)
      participation.progress[programId] = progress

      this.saveUserParticipation(wallet.publicAddress, participation)
      debug(`Updated progress for program ${programId}:`, progress)
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }
}

// Export convenience functions
export const joinProgram = ProgramParticipation.joinProgram.bind(ProgramParticipation)
export const leaveProgram = ProgramParticipation.leaveProgram.bind(ProgramParticipation)
export const hasJoinedProgram = ProgramParticipation.hasJoinedProgram.bind(ProgramParticipation)
export const getUserJoinedPrograms = ProgramParticipation.getUserJoinedPrograms.bind(ProgramParticipation)
export const updateProgress = ProgramParticipation.updateProgress.bind(ProgramParticipation)