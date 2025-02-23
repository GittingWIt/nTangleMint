export type ProgramType = 
  | 'punch-card'
  | 'coupon-book'
  | 'loyalty'
  | 'partnerships'
  | 'tiered'

export interface BaseProgram {
  id: string
  type: ProgramType
  merchantId: string
  businessName: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  isActive: boolean
  participants: string[]
  category: string
  terms: string
}

export interface ProgramAction<T extends BaseProgram> {
  createProgram: (program: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => T
  updateProgram: (id: string, updates: Partial<T>) => T
  deleteProgram: (id: string) => boolean
  getProgram: (id: string) => T | null
  joinProgram: (programId: string, userId: string) => boolean
  leaveProgram: (programId: string, userId: string) => boolean
}

export interface ProgramUtils<T extends BaseProgram> {
  validateProgram: (program: Partial<T>) => boolean
  formatProgramData: (program: T) => any
  getProgramStats: (program: T) => any
}