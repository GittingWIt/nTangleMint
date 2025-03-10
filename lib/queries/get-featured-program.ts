import { getPrograms } from "@/lib/storage"
import type { Program } from "@/types"

export async function getFeaturedPrograms(): Promise<Program[]> {
  const allPrograms = await getPrograms()

  // Filter for active and public programs only
  return allPrograms.filter((program) => program.status === "active" && program.isPublic === true)
}