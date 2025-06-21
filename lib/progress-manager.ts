class ProgressManager {
  private storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null

  private getStorageKey(userAddress: string, programId: string): string {
    return `user_progress_${userAddress}_${programId}`
  }

  getProgress(userAddress: string, programId: string): UserProgress {
    // Return default progress on server-side
    if (typeof window === "undefined") {
      return {
        punches: 0,
        couponsUsed: 0,
        lastActivity: new Date().toISOString(),
        achievements: [],
      }
    }

    const key = this.getStorageKey(userAddress, programId)
    const storedProgress = this.storage?.getItem(key)

    if (storedProgress) {
      try {
        return JSON.parse(storedProgress) as UserProgress
      } catch (error) {
        console.error("Error parsing stored progress:", error)
        return this.getDefaultProgress()
      }
    }

    return this.getDefaultProgress()
  }

  saveProgress(userAddress: string, programId: string, progress: UserProgress): void {
    if (typeof window === "undefined") {
      return
    }

    const key = this.getStorageKey(userAddress, programId)
    this.storage?.setItem(key, JSON.stringify(progress))
  }

  clearProgress(userAddress: string, programId: string): void {
    if (typeof window === "undefined") {
      return
    }

    const key = this.getStorageKey(userAddress, programId)
    this.storage?.removeItem(key)
  }

  private getDefaultProgress(): UserProgress {
    return {
      punches: 0,
      couponsUsed: 0,
      lastActivity: new Date().toISOString(),
      achievements: [],
    }
  }
}

export interface UserProgress {
  punches: number
  couponsUsed: number
  lastActivity: string
  achievements: string[]
}

export default ProgressManager