export function debugStorage(userId: string) {
  // Only run in development mode
  if (process.env.NODE_ENV !== "development") return

  console.log("DEBUG STORAGE for user:", userId)

  try {
    // Check user coupons
    const userCouponsKey = `user-coupons-${userId}`
    const couponsStr = localStorage.getItem(userCouponsKey)

    if (couponsStr) {
      try {
        const coupons = JSON.parse(couponsStr)
        console.log(`${userCouponsKey}: ${coupons.length} coupons found`)
      } catch (e) {
        console.error("Error parsing coupons:", e)
      }
    } else {
      console.log(`${userCouponsKey}: No coupons found`)
    }

    // Check user programs
    const userProgramsKey = `user-programs-${userId}`
    const programsStr = localStorage.getItem(userProgramsKey)

    if (programsStr) {
      try {
        const programs = JSON.parse(programsStr)
        console.log(`${userProgramsKey}: ${programs.length} programs found`)
      } catch (e) {
        console.error("Error parsing programs:", e)
      }
    } else {
      console.log(`${userProgramsKey}: No programs found`)
    }

    // Don't log all localStorage keys in normal operation
    // Only log if explicitly requested with a flag
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log("All localStorage keys:")
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          console.log(`${key}: ${value ? value.substring(0, 50) + "..." : "null"}`)
        }
      }
    }
  } catch (error) {
    console.error("Error in debugStorage:", error)
  }
}