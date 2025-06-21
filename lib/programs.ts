import { ProgramDerivation } from "@/lib/program-derivation"

export class Programs {
  static async getProgramAddress(programId: string): Promise<string> {
    const programDerivation = new ProgramDerivation(programId)
    return programDerivation.getProgramAddress()
  }
}