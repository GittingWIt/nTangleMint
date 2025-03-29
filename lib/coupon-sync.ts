import { debug } from "./debug"

/**
 * Synchronizes program participants with clipped coupons
 * This ensures that when a user clips a coupon, they're also added as a program participant
 * and vice versa
 */
export function syncProgramsAndCoupons() {
  try {
    // Get all programs
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) return

    const programs = JSON.parse(programsStr)
    let programsUpdated = false

    // Get all user IDs with coupons
    const userIds = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("user-coupons-")) {
        const userId = key.replace("user-coupons-", "")
        userIds.push(userId)
      }
    }

    // For each user
    for (const userId of userIds) {
      // Get their coupons
      const userCouponsKey = `user-coupons-${userId}`
      const couponsStr = localStorage.getItem(userCouponsKey)
      if (!couponsStr) continue

      try {
        const userCoupons = JSON.parse(couponsStr)

        // For each coupon
        for (const coupon of userCoupons) {
          // Find matching program
          const programIndex = programs.findIndex((p: any) => p.id === coupon.id)
          if (programIndex !== -1) {
            // Initialize participants array if it doesn't exist
            if (!programs[programIndex].participants) {
              programs[programIndex].participants = []
            }

            // Add user to participants if not already there
            if (!programs[programIndex].participants.includes(userId)) {
              programs[programIndex].participants.push(userId)
              programsUpdated = true
              debug(`Added user ${userId} to program ${coupon.id} participants`)
            }
          }
        }
      } catch (error) {
        console.error("Error processing user coupons:", error)
      }
    }

    // Save updated programs if changes were made
    if (programsUpdated) {
      localStorage.setItem("programs", JSON.stringify(programs))
      debug("Updated programs with synchronized participant data")
    }

    return programsUpdated
  } catch (error) {
    console.error("Error synchronizing programs and coupons:", error)
    return false
  }
}