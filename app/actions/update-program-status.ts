"use server"

import { revalidatePath } from "next/cache"
import { getProgram, updateProgram } from "@/lib/storage"
import type { Program } from "@/types"

export async function updateProgramStatus(
  programId: string,
  status: Program["status"],
  merchantAddress: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const program = await getProgram(programId)

    if (!program) {
      return { success: false, error: "Program not found" }
    }

    if (program.merchantAddress !== merchantAddress) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the program status
    program.status = status
    program.updatedAt = new Date().toISOString()

    // If activating, also set isPublic to true
    if (status === "active") {
      program.isPublic = true
    }

    // Save the updated program
    await updateProgram(programId, program)

    // Revalidate relevant paths
    revalidatePath("/merchant/programs")
    revalidatePath("/merchant/programs/[id]", "page")
    revalidatePath("/") // Revalidate home page for featured programs

    return { success: true }
  } catch (error) {
    console.error("Failed to update program status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update program status",
    }
  }
}