import { getPrograms } from "@/lib/storage-compat"
import type { Program } from "@/types"

export async function getFeaturedPrograms(): Promise<Program[]> {
  const allPrograms = await getPrograms()

  // Filter for active and public programs only
  return allPrograms.filter((program: Program) => program.status === "active" && program.isPublic === true)
}