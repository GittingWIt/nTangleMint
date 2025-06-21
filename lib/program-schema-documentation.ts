/**
 * Program Data Structure Documentation - Updated for Seed-Based Architecture
 *
 * This file documents the program data structure and field naming conventions
 * to help developers understand the schema after our architectural updates.
 */

import { debug } from "./debug"

/**
 * Document the updated program schema fields and their usage in seed-based architecture
 */
export function documentProgramSchema() {
  debug("📝 Program Schema Documentation - Seed-Based Architecture")
  debug("========================================================")
  debug("")
  debug("🌱 SEED-BASED ARCHITECTURE OVERVIEW")
  debug("----------------------------------")
  debug("Programs are now created deterministically from wallet seeds through the merchant UI.")
  debug("No default/hardcoded programs exist - all programs are user-created.")
  debug("")
  debug("Field: merchantAddress")
  debug("---------------------")
  debug("Purpose: Stores the address of the wallet that created/owns the program")
  debug("Seed-based notes:")
  debug("  - Generated deterministically from merchant's wallet seed")
  debug("  - When viewed by a merchant: This is the merchant's own wallet address")
  debug("  - When viewed by a customer: This represents the program owner's address")
  debug("  - NO hardcoded merchant addresses exist in the system")
  debug("")
  debug("Field: participants")
  debug("-------------------")
  debug("Purpose: Array of wallet addresses that have joined this program")
  debug("Seed-based notes:")
  debug("  - Customer wallets are added when they join through the UI")
  debug("  - All addresses are generated from user wallet seeds")
  debug("  - No default/mock participants exist")
  debug("")
  debug("Field: id")
  debug("---------")
  debug("Purpose: Unique identifier for the program")
  debug("Seed-based notes:")
  debug("  - Generated deterministically from merchant seed + program data")
  debug("  - Ensures consistent program IDs across wallet restorations")
  debug("  - No hardcoded program IDs exist")
  debug("")
  debug("Field: isPublic")
  debug("--------------")
  debug("Purpose: Determines if the program is visible to all users")
  debug("Seed-based notes:")
  debug("  - Set by merchant during program creation through UI")
  debug("  - When true: Program appears in public listings")
  debug("  - When false: Program is only visible to owner and participants")
  debug("")
  debug("Field: metadata")
  debug("---------------")
  debug("Purpose: Contains program-specific configuration and display data")
  debug("Seed-based notes:")
  debug("  - All metadata is user-provided through creation forms")
  debug("  - No default values or hardcoded merchant names")
  debug("  - Includes: discountAmount, requiredPunches, expirationDate, etc.")
  debug("")
  debug("🚫 REMOVED ELEMENTS")
  debug("==================")
  debug("The following have been eliminated from the architecture:")
  debug("  ❌ Default program creation (ensureDefaultCoupons, ensureDefaultPunchCards)")
  debug("  ❌ Hardcoded merchant addresses")
  debug("  ❌ Mock/sample programs")
  debug("  ❌ Automatic program generation during wallet restoration")
  debug("  ❌ Manual coupon creation functions")
  debug("")
  debug("✅ CURRENT PROGRAM LIFECYCLE")
  debug("===========================")
  debug("1. Merchant creates wallet (seed-based)")
  debug("2. Merchant creates program through UI")
  debug("3. Program ID generated deterministically from seed")
  debug("4. Program stored with merchant's wallet address")
  debug("5. Customers can discover and join public programs")
  debug("6. All data persists and restores consistently via seeds")
}

/**
 * Check if the current wallet has joined a specific program
 * @param programId The ID of the program to check
 * @returns boolean indicating if the current wallet is a participant
 */
export function hasJoinedProgram(programId: string): boolean {
  try {
    // Get current wallet address
    const walletDataStr = localStorage.getItem("walletData")
    if (!walletDataStr) return false

    const walletData = JSON.parse(walletDataStr)
    const customerAddress = walletData.publicAddress

    // Get program
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) return false

    const programs = JSON.parse(programsStr)
    const program = programs.find((p: any) => p.id === programId)

    if (!program) return false

    // Check if customer address is in participants array
    return Array.isArray(program.participants) && program.participants.includes(customerAddress)
  } catch (error) {
    console.error("Error checking program participation:", error)
    return false
  }
}

/**
 * Get the role of the current wallet in relation to a program
 * @param programId The ID of the program to check
 * @returns 'owner' | 'participant' | 'non-participant'
 */
export function getProgramRelationship(programId: string): "owner" | "participant" | "non-participant" {
  try {
    // Get current wallet address
    const walletDataStr = localStorage.getItem("walletData")
    if (!walletDataStr) return "non-participant"

    const walletData = JSON.parse(walletDataStr)
    const currentAddress = walletData.publicAddress

    // Get program
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) return "non-participant"

    const programs = JSON.parse(programsStr)
    const program = programs.find((p: any) => p.id === programId)

    if (!program) return "non-participant"

    // Check if current address is the merchant address (owner)
    if (program.merchantAddress === currentAddress) {
      return "owner"
    }

    // Check if current address is in participants array
    if (Array.isArray(program.participants) && program.participants.includes(currentAddress)) {
      return "participant"
    }

    return "non-participant"
  } catch (error) {
    console.error("Error determining program relationship:", error)
    return "non-participant"
  }
}

/**
 * Validate that no hardcoded programs exist in storage
 * @returns boolean indicating if storage is clean of hardcoded data
 */
export function validateSeedBasedArchitecture(): boolean {
  try {
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) return true // No programs is valid

    const programs = JSON.parse(programsStr)

    // Check for any programs with hardcoded/default characteristics
    const hasHardcodedPrograms = programs.some((program: any) => {
      // Check for hardcoded merchant addresses (none should exist)
      const hasHardcodedAddress =
        program.merchantAddress &&
        (program.merchantAddress.includes("manual") ||
          program.merchantAddress.includes("default") ||
          program.merchantAddress.includes("sample"))

      // Check for hardcoded program names
      const hasHardcodedName =
        program.name &&
        (program.name.includes("Manual") || program.name.includes("Default") || program.name.includes("Sample"))

      return hasHardcodedAddress || hasHardcodedName
    })

    if (hasHardcodedPrograms) {
      debug("⚠️ Warning: Hardcoded programs detected in storage")
      return false
    }

    debug("✅ Storage validated: All programs are seed-based")
    return true
  } catch (error) {
    console.error("Error validating seed-based architecture:", error)
    return false
  }
}