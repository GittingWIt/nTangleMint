"use server"

import { updateProgram } from "@/lib/programs"
import { verifyProgramOwnership } from "@/lib/programs"
import type { Program } from "@/types"

export async function updateProgramStatus(programId: string, newStatus: Program["status"]) {
  try {
    // Verify ownership
    const isOwner = await verifyProgramOwnership(programId)
    if (!isOwner) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the program
    const program = await import("@/lib/programs").then((m) => m.getProgramById(programId))
    if (!program) {
      return { success: false, error: "Program not found" }
    }

    // Update the program
    const updatedProgram = {
      ...program,
      status: newStatus,
      isPublic: newStatus === "active",
      updatedAt: new Date().toISOString(),
    }

    await updateProgram(programId, updatedProgram)

    return { success: true }
  } catch (error) {
    console.error("Error updating program status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}