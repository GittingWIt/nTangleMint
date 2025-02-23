import type { PunchCardProgram, PunchCardActions } from './types'
import type { ProgramAction } from '../types'

export const createPunchCardActions = (): ProgramAction<PunchCardProgram> & PunchCardActions => {
  const createProgram = (program: Omit<PunchCardProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: PunchCardProgram = {
      ...program,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      punchesData: {},
      participants: []
    }
    
    // Save to localStorage
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.push(newProgram)
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return newProgram
  }

  const updateProgram = (id: string, updates: Partial<PunchCardProgram>) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const index = programs.findIndex((p: PunchCardProgram) => p.id === id)
    
    if (index === -1) throw new Error('Program not found')
    
    const updatedProgram = {
      ...programs[index],
      ...updates,
      updatedAt: Date.now()
    }
    
    programs[index] = updatedProgram
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return updatedProgram
  }

  const deleteProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const filtered = programs.filter((p: PunchCardProgram) => p.id !== id)
    localStorage.setItem('programs', JSON.stringify(filtered))
    return true
  }

  const getProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    return programs.find((p: PunchCardProgram) => p.id === id) || null
  }

  const joinProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants.push(userId)
    program.punchesData[userId] = {
      currentPunches: 0,
      punchHistory: []
    }
    
    updateProgram(programId, program)
    return true
  }

  const leaveProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants = program.participants.filter(id => id !== userId)
    delete program.punchesData[userId]
    
    updateProgram(programId, program)
    return true
  }

  const addPunch = (programId: string, userId: string, location?: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const userData = program.punchesData[userId]
    if (!userData) return false
    
    userData.currentPunches++
    userData.punchHistory.push({
      timestamp: Date.now(),
      location
    })
    
    updateProgram(programId, program)
    return true
  }

  const redeemReward = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const userData = program.punchesData[userId]
    if (!userData || userData.currentPunches < program.requiredPunches) return false
    
    userData.currentPunches -= program.requiredPunches
    
    updateProgram(programId, program)
    return true
  }

  const getPunchesCount = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return 0
    
    return program.punchesData[userId]?.currentPunches || 0
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addPunch,
    redeemReward,
    getPunchesCount
  }
}