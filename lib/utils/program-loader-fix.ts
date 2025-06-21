import { debug } from "@/lib/debug"

/**
 * Utility to fix program loading issues
 */
export function fixProgramLoading() {
  try {
    debug("Fixing program loading issues...")

    // Get all programs from storage
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) {
      debug("No programs found in storage")
      return false
    }

    let programs
    try {
      programs = JSON.parse(programsStr)
    } catch (e) {
      debug("Error parsing programs:", e)
      return false
    }

    if (!Array.isArray(programs)) {
      debug("Programs is not an array")
      return false
    }

    // Check if we have the new storage format
    const hasNewFormat = Object.keys(localStorage).some((key) => key.startsWith("program:"))

    // If we don't have the new format, migrate to it
    if (!hasNewFormat && programs.length > 0) {
      debug("Migrating to new storage format...")

      // Store each program individually
      programs.forEach((program) => {
        if (program.id) {
          localStorage.setItem(`program:${program.id}`, JSON.stringify(program))
        }
      })

      // Create merchant programs index
      const merchantAddresses = new Set(programs.map((p) => p.merchantAddress).filter(Boolean))

      merchantAddresses.forEach((address) => {
        if (address) {
          const merchantProgramIds = programs.filter((p) => p.merchantAddress === address).map((p) => p.id)

          localStorage.setItem(`merchant:programs:${address}`, JSON.stringify(merchantProgramIds))
        }
      })

      debug("Migration complete")
      return true
    }

    debug("No migration needed")
    return false
  } catch (error) {
    console.error("Error fixing program loading:", error)
    return false
  }
}

/**
 * Utility to reassign all programs to a specific merchant
 */
export function reassignProgramsToMerchant(merchantAddress: string) {
  try {
    if (!merchantAddress) {
      debug("No merchant address provided")
      return false
    }

    debug(`Reassigning programs to merchant: ${merchantAddress}`)

    // Get all programs from storage
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) {
      debug("No programs found in storage")
      return false
    }

    let programs
    try {
      programs = JSON.parse(programsStr)
    } catch (e) {
      debug("Error parsing programs:", e)
      return false
    }

    if (!Array.isArray(programs)) {
      debug("Programs is not an array")
      return false
    }

    // Reassign all programs to the merchant
    let reassignedCount = 0
    programs.forEach((program) => {
      if (program.merchantAddress !== merchantAddress) {
        program.merchantAddress = merchantAddress
        reassignedCount++
      }
    })

    if (reassignedCount > 0) {
      // Save updated programs
      localStorage.setItem("programs", JSON.stringify(programs))

      // Update individual program storage if using new format
      programs.forEach((program) => {
        if (program.id) {
          localStorage.setItem(`program:${program.id}`, JSON.stringify(program))
        }
      })

      // Update merchant programs index
      const merchantProgramIds = programs.filter((p) => p.merchantAddress === merchantAddress).map((p) => p.id)

      localStorage.setItem(`merchant:programs:${merchantAddress}`, JSON.stringify(merchantProgramIds))
      localStorage.setItem("merchant:programs", JSON.stringify(merchantProgramIds))

      debug(`Reassigned ${reassignedCount} programs to merchant ${merchantAddress}`)

      // Dispatch event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("programsUpdated"))
      }

      return true
    }

    debug("No programs needed reassigning")
    return false
  } catch (error) {
    console.error("Error reassigning programs:", error)
    return false
  }
}

export default {
  fixProgramLoading,
  reassignProgramsToMerchant,
}