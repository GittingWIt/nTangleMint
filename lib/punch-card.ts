import { debug } from "./debug"

/**
 * Add a punch to a user's punch card
 * @param programId The ID of the punch card program
 * @param userWalletAddress The user's wallet address
 * @returns The updated number of punches
 */
export function addPunch(programId: string, userWalletAddress: string): number {
  if (!programId || !userWalletAddress) {
    debug("Missing programId or userWalletAddress")
    return 0
  }

  try {
    // Get current punches
    const userPunchesKey = `user-punches-${userWalletAddress}`
    let allPunches: Record<string, number> = {}

    try {
      const punchesData = localStorage.getItem(userPunchesKey)
      if (punchesData) {
        allPunches = JSON.parse(punchesData)
      }
    } catch (e) {
      debug("Error parsing punch data:", e)
    }

    // Update punches for this program
    const currentPunches = allPunches[programId] || 0
    const newPunches = currentPunches + 1
    allPunches[programId] = newPunches

    // Save updated punches
    localStorage.setItem(userPunchesKey, JSON.stringify(allPunches))

    // Dispatch event to notify components
    window.dispatchEvent(
      new CustomEvent("punchAdded", {
        detail: { programId, userWalletAddress, punches: newPunches },
      }),
    )

    debug(`Added punch to program ${programId} for user ${userWalletAddress}. Total: ${newPunches}`)
    return newPunches
  } catch (error) {
    console.error("Error adding punch:", error)
    return 0
  }
}

/**
 * Check if a user has enough punches to redeem a reward
 * @param programId The ID of the punch card program
 * @param userWalletAddress The user's wallet address
 * @param requiredPunches The number of punches required for a reward
 * @returns Whether the user has enough punches
 */
export function canRedeemReward(programId: string, userWalletAddress: string, requiredPunches: number): boolean {
  if (!programId || !userWalletAddress) return false

  try {
    const userPunchesKey = `user-punches-${userWalletAddress}`
    const punchesData = localStorage.getItem(userPunchesKey)

    if (!punchesData) return false

    const allPunches: Record<string, number> = JSON.parse(punchesData)
    const currentPunches = allPunches[programId] || 0

    return currentPunches >= requiredPunches
  } catch (error) {
    console.error("Error checking reward eligibility:", error)
    return false
  }
}

/**
 * Redeem a reward, resetting the punch count
 * @param programId The ID of the punch card program
 * @param userWalletAddress The user's wallet address
 * @returns Whether the redemption was successful
 */
export function redeemReward(programId: string, userWalletAddress: string): boolean {
  if (!programId || !userWalletAddress) return false

  try {
    const userPunchesKey = `user-punches-${userWalletAddress}`
    const punchesData = localStorage.getItem(userPunchesKey)

    if (!punchesData) return false

    const allPunches: Record<string, number> = JSON.parse(punchesData)

    // Reset punches for this program
    allPunches[programId] = 0

    // Save updated punches
    localStorage.setItem(userPunchesKey, JSON.stringify(allPunches))

    // Dispatch event to notify components
    window.dispatchEvent(
      new CustomEvent("rewardRedeemed", {
        detail: { programId, userWalletAddress },
      }),
    )

    debug(`Redeemed reward for program ${programId} for user ${userWalletAddress}`)
    return true
  } catch (error) {
    console.error("Error redeeming reward:", error)
    return false
  }
}