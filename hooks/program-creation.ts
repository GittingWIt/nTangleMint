"use client"

import { useState } from "react"
import { ProgramDerivation } from "@/lib/program-derivation"
import { getWalletData, addProgram } from "@/lib/storage-compat"
import { debug } from "@/lib/debug"
import type { Program, ProgramType } from "@/types"

/**
 * Hook for creating programs using seed-based derivation
 * Programs are only created when merchant explicitly creates them through UI
 */
export function useProgramCreation() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create a new program using seed-based derivation
   * This is called when merchant goes through the program creation UI
   */
  const createProgram = async (
    programType: ProgramType,
    customData?: Partial<Program>,
  ): Promise<{ success: boolean; program?: Program; error?: string }> => {
    setIsCreating(true)
    setError(null)

    try {
      const walletData = getWalletData()

      if (!walletData) {
        throw new Error("No wallet found")
      }

      if (walletData.type !== "merchant") {
        throw new Error("Only merchants can create programs")
      }

      if (!walletData.mnemonic) {
        throw new Error("Wallet mnemonic required for program creation")
      }

      debug(`Creating ${programType} program for merchant: ${walletData.publicAddress}`)

      // Use seed-based derivation to create the program
      const derivation = new ProgramDerivation(
        walletData.mnemonic,
        undefined, // password
        walletData.publicAddress,
        walletData.businessName || "Local Business",
      )

      // Find next available index for this program type
      const existingPrograms = await getExistingPrograms()
      const sameTypePrograms = existingPrograms.filter(
        (p) => p.type === programType && p.merchantAddress === walletData.publicAddress,
      )
      const nextIndex = sameTypePrograms.length

      // Derive the program
      const derivedProgram = derivation.deriveProgram(programType, nextIndex)

      // Merge with any custom data provided by the merchant
      const finalProgram: Program = {
        ...derivedProgram,
        ...customData,
        // Ensure these core fields are not overridden
        id: derivedProgram.id,
        type: programType,
        merchantAddress: walletData.publicAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save the program
      const result = addProgram(finalProgram)

      if (!result.success) {
        throw new Error(result.error || "Failed to save program")
      }

      debug(`Successfully created program: ${finalProgram.name} (${finalProgram.id})`)

      return {
        success: true,
        program: finalProgram,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create program"
      setError(errorMessage)
      console.error("Error creating program:", err)

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Restore merchant's programs from seed (called during wallet restoration)
   */
  const restorePrograms = async (): Promise<{ success: boolean; programs?: Program[]; error?: string }> => {
    try {
      const walletData = getWalletData()

      if (!walletData || !walletData.mnemonic) {
        throw new Error("No wallet or mnemonic found")
      }

      if (walletData.type !== "merchant") {
        return { success: true, programs: [] } // Customers don't have programs to restore
      }

      debug(`Restoring programs for merchant: ${walletData.publicAddress}`)

      // Get existing programs to see what this merchant has created
      const existingPrograms = await getExistingPrograms()
      const merchantPrograms = existingPrograms.filter((p) => p.merchantAddress === walletData.publicAddress)

      debug(`Found ${merchantPrograms.length} existing programs for merchant`)

      return {
        success: true,
        programs: merchantPrograms,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to restore programs"
      console.error("Error restoring programs:", err)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  // Helper function to get existing programs
  const getExistingPrograms = async (): Promise<Program[]> => {
    try {
      // This would typically come from your storage system
      const { getPrograms } = await import("@/lib/storage-compat")
      return getPrograms()
    } catch (error) {
      console.error("Error getting existing programs:", error)
      return []
    }
  }

  return {
    createProgram,
    restorePrograms,
    isCreating,
    error,
  }
}

/**
 * Utility function to check if a program belongs to the current merchant
 */
export function isProgramOwnedByMerchant(programId: string): boolean {
  try {
    const walletData = getWalletData()

    if (!walletData || !walletData.mnemonic || walletData.type !== "merchant") {
      return false
    }

    const derivation = new ProgramDerivation(walletData.mnemonic, undefined, walletData.publicAddress)

    return derivation.isOwnProgram(programId)
  } catch (error) {
    console.error("Error checking program ownership:", error)
    return false
  }
}