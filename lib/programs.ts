import { getWalletData, addProgram as addProgramToStorage, getPrograms } from "./storage"
import type { Program } from "@/types"
import { debug } from "./debug"

export async function fetchMerchantPrograms(): Promise<Program[]> {
  try {
    // Get current merchant wallet
    const wallet = await getWalletData()
    if (!wallet || !wallet.publicAddress) {
      console.warn("No wallet found or invalid wallet")
      return []
    }

    // Get all programs from storage
    const allPrograms = await getPrograms()

    // Filter for current merchant
    const merchantPrograms = allPrograms.filter((program) => program.merchantAddress === wallet.publicAddress)

    debug(`Found ${merchantPrograms.length} programs for merchant ${wallet.publicAddress}`)
    return merchantPrograms
  } catch (error) {
    console.error("Error fetching merchant programs:", error)
    return []
  }
}

export async function saveProgram(program: Omit<Program, "id">): Promise<Program | null> {
  try {
    // Get current merchant wallet
    const wallet = await getWalletData()
    if (!wallet || !wallet.publicAddress) {
      throw new Error("No wallet found or invalid wallet")
    }

    // Ensure program has all required fields
    const programToSave: Omit<Program, "id"> = {
      ...program,
      merchantAddress: wallet.publicAddress,
      status: "active", // Explicitly set status to active
      isPublic: true, // Explicitly set isPublic to true
      type: program.type || "coupon-book", // Default to coupon-book if not specified
      participants: program.participants || [],
      version: program.version || 1,
      metadata: program.metadata || {},
    }

    debug("Saving program with fields:", {
      name: programToSave.name,
      status: programToSave.status,
      isPublic: programToSave.isPublic,
      type: programToSave.type,
    })

    // Save program using the storage function
    const savedProgram = await addProgramToStorage(programToSave)

    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent("programsUpdated"))

    debug("Program saved successfully:", savedProgram.name)
    return savedProgram
  } catch (error) {
    console.error("Error saving program:", error)
    return null
  }
}

export async function verifyProgramOwnership(programId: string): Promise<boolean> {
  try {
    const wallet = await getWalletData()
    if (!wallet || !wallet.publicAddress) {
      return false
    }

    const programs = await fetchMerchantPrograms()
    const program = programs.find((p) => p.id === programId)

    return program?.merchantAddress === wallet.publicAddress
  } catch (error) {
    console.error("Error verifying program ownership:", error)
    return false
  }
}