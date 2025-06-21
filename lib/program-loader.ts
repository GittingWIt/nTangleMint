// lib/program-loader.ts - Ultra-simplified version

interface ProgramData {
  id: string
  name: string
  description: string
  type: string
  status: string
  merchantAddress: string
  participants: any[]
  stats: any
  expirationDate?: string
  metadata?: any
}

// Simple program loading functions
export function loadMerchantPrograms(): ProgramData[] {
  try {
    const programs = localStorage.getItem("programs")
    return programs ? JSON.parse(programs) : []
  } catch {
    return []
  }
}

export function saveMerchantPrograms(programs: ProgramData[]): void {
  try {
    localStorage.setItem("programs", JSON.stringify(programs))
  } catch (error) {
    console.error("Error saving programs:", error)
  }
}

export function addMerchantProgram(program: ProgramData): void {
  const programs = loadMerchantPrograms()
  programs.push(program)
  saveMerchantPrograms(programs)
}

export function updateMerchantProgram(updatedProgram: ProgramData): void {
  const programs = loadMerchantPrograms()
  const index = programs.findIndex((p) => p.id === updatedProgram.id)
  if (index !== -1) {
    programs[index] = updatedProgram
    saveMerchantPrograms(programs)
  }
}

export function deleteMerchantProgram(programId: string): void {
  const programs = loadMerchantPrograms()
  const filtered = programs.filter((p) => p.id !== programId)
  saveMerchantPrograms(filtered)
}

// Default export for backward compatibility
export default {
  loadMerchantPrograms,
  saveMerchantPrograms,
  addMerchantProgram,
  updateMerchantProgram,
  deleteMerchantProgram,
}