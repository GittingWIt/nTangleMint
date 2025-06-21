/**
 * Program recovery utilities
 * Helps recover programs that might be lost or corrupted
 */
import { debug } from "@/lib/debug"
import { getWalletData } from "@/lib/storage-compat"

/**
 * Recover copied programs
 * This function identifies potential copied programs using various heuristics
 * @returns Array of recovered program IDs
 */
export function recoverCopiedPrograms(): string[] {
  try {
    debug("Attempting to recover copied programs...")
    const recoveredIds: string[] = []

    // Get all programs from localStorage
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) {
      debug("No programs found in storage")
      return recoveredIds
    }

    // Parse programs
    let programs
    try {
      programs = JSON.parse(programsStr)
    } catch (e) {
      debug("Error parsing programs:", e)
      return recoveredIds
    }

    if (!Array.isArray(programs)) {
      debug("Programs data is not an array")
      return recoveredIds
    }

    // Get current wallet data
    const walletData = getWalletData()
    const merchantAddress = walletData?.publicAddress

    // Find potential copied programs using various heuristics
    const potentialCopies = programs.filter((p) => {
      // Check for "Copy of" in name (original check)
      if (p.name && typeof p.name === "string" && p.name.startsWith("Copy of")) {
        return true
      }

      // Check for programs with IDs containing "copy"
      if (p.id && typeof p.id === "string" && p.id.includes("copy")) {
        return true
      }

      // Check for similar programs with same type but different IDs
      const similarPrograms = programs.filter(
        (other) =>
          other.id !== p.id &&
          other.type === p.type &&
          other.name === p.name &&
          Math.abs(new Date(other.createdAt).getTime() - new Date(p.createdAt).getTime()) < 1000 * 60 * 60, // Created within an hour
      )

      if (similarPrograms.length > 0) {
        return true
      }

      // Check for programs created recently (within the last day)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      if (new Date(p.createdAt) > oneDayAgo) {
        return true
      }

      // Check for programs with missing merchant address
      if (!p.merchantAddress && merchantAddress) {
        return true
      }

      return false
    })

    debug(`Found ${potentialCopies.length} potential copied programs`)

    // Ensure each potential copied program is properly saved
    potentialCopies.forEach((program) => {
      if (program.id) {
        // Save individually
        localStorage.setItem(`program:${program.id}`, JSON.stringify(program))
        recoveredIds.push(program.id)
        debug(`Recovered potential copied program: ${program.name} (${program.id})`)

        // Ensure it has the correct merchant address
        if (merchantAddress && (!program.merchantAddress || program.merchantAddress !== merchantAddress)) {
          program.merchantAddress = merchantAddress
          debug(`Updated merchant address for program ${program.id}`)

          // Update in the programs array
          const index = programs.findIndex((p) => p.id === program.id)
          if (index !== -1) {
            programs[index] = program
          }
        }
      }
    })

    // Save updated programs array if needed
    if (recoveredIds.length > 0) {
      localStorage.setItem("programs", JSON.stringify(programs))

      // Dispatch event to notify components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("programsUpdated"))
      }
    }

    return recoveredIds
  } catch (error) {
    console.error("Error recovering copied programs:", error)
    return []
  }
}

/**
 * Recover all programs
 * This is a more comprehensive recovery that tries to fix various issues
 * @returns Object with recovery statistics
 */
export function recoverAllPrograms(): { recovered: number; fixed: number; total: number } {
  try {
    debug("Attempting comprehensive program recovery...")
    let recovered = 0
    let fixed = 0
    let total = 0

    // Get all programs from localStorage
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) {
      debug("No programs found in storage")
      return { recovered, fixed, total }
    }

    // Parse programs
    let programs
    try {
      programs = JSON.parse(programsStr)
    } catch (e) {
      debug("Error parsing programs:", e)
      return { recovered, fixed, total }
    }

    if (!Array.isArray(programs)) {
      debug("Programs data is not an array")
      return { recovered, fixed, total }
    }

    total = programs.length
    debug(`Found ${total} total programs`)

    // Get current wallet data
    const walletData = getWalletData()
    const merchantAddress = walletData?.publicAddress

    // Fix each program
    programs.forEach((program) => {
      let programFixed = false

      // Ensure program has an ID
      if (!program.id) {
        program.id = `program-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        programFixed = true
      }

      // Ensure program has a merchant address
      if (merchantAddress && (!program.merchantAddress || program.merchantAddress === "")) {
        program.merchantAddress = merchantAddress
        programFixed = true
      }

      // Ensure program has a status
      if (!program.status) {
        program.status = "active"
        programFixed = true
      }

      // Ensure program has timestamps
      if (!program.createdAt) {
        program.createdAt = new Date().toISOString()
        programFixed = true
      }

      if (!program.updatedAt) {
        program.updatedAt = new Date().toISOString()
        programFixed = true
      }

      // Ensure program has a type
      if (!program.type) {
        // Try to determine type from name or metadata
        if (program.name && program.name.toLowerCase().includes("coffee")) {
          program.type = "punch-card"
        } else if (program.name && program.name.toLowerCase().includes("discount")) {
          program.type = "coupon-book"
        } else {
          program.type = "points" // Default type
        }
        programFixed = true
      }

      // Save individually
      localStorage.setItem(`program:${program.id}`, JSON.stringify(program))
      recovered++

      if (programFixed) {
        fixed++
      }
    })

    // Save updated programs array
    localStorage.setItem("programs", JSON.stringify(programs))

    // Dispatch event to notify components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("programsUpdated"))
    }

    debug(`Recovery complete: ${recovered} programs recovered, ${fixed} programs fixed`)
    return { recovered, fixed, total }
  } catch (error) {
    console.error("Error in comprehensive program recovery:", error)
    return { recovered: 0, fixed: 0, total: 0 }
  }
}

/**
 * Recover the Summer Discount program specifically
 * @returns Boolean indicating if recovery was successful
 */
export function recoverSummerDiscountProgram(): boolean {
  try {
    debug("Attempting to recover Summer Discount program...")

    // Get all programs from localStorage
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) {
      debug("No programs found in storage")
      return false
    }

    // Parse programs
    let programs
    try {
      programs = JSON.parse(programsStr)
    } catch (e) {
      debug("Error parsing programs:", e)
      return false
    }

    if (!Array.isArray(programs)) {
      debug("Programs data is not an array")
      return false
    }

    // Look for Summer Discount program by name
    const summerDiscountProgram = programs.find(
      (p) => p.name === "Summer Discount" || p.id.includes("summer-discount") || p.id === "m8qnmqxexfyjygzdv",
    )

    if (summerDiscountProgram) {
      debug(`Found Summer Discount program: ${summerDiscountProgram.id}`)

      // Update the ID to be consistent
      summerDiscountProgram.id = "summer-discount"

      // Save the program individually
      localStorage.setItem(`program:summer-discount`, JSON.stringify(summerDiscountProgram))

      // Update in the programs array
      const index = programs.findIndex((p) => p.id === summerDiscountProgram.id)
      if (index !== -1) {
        programs[index] = summerDiscountProgram
      }

      // Save updated programs array
      localStorage.setItem("programs", JSON.stringify(programs))

      // Dispatch event to notify components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("programsUpdated"))
      }

      debug("Successfully recovered Summer Discount program")
      return true
    }

    debug("Summer Discount program not found")
    return false
  } catch (error) {
    console.error("Error recovering Summer Discount program:", error)
    return false
  }
}

export default {
  recoverCopiedPrograms,
  recoverAllPrograms,
  recoverSummerDiscountProgram,
}