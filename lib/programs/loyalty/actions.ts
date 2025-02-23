import type { LoyaltyProgram, LoyaltyActions } from './types'
import type { ProgramAction } from '../types'

export const createLoyaltyActions = (): ProgramAction<LoyaltyProgram> & LoyaltyActions => {
  const createProgram = (program: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: LoyaltyProgram = {
      ...program,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userPoints: {},
      participants: []
    }
    
    // Save to localStorage
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.push(newProgram)
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return newProgram
  }

  const updateProgram = (id: string, updates: Partial<LoyaltyProgram>) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const index = programs.findIndex((p: LoyaltyProgram) => p.id === id)
    
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
    const filtered = programs.filter((p: LoyaltyProgram) => p.id !== id)
    localStorage.setItem('programs', JSON.stringify(filtered))
    return true
  }

  const getProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    return programs.find((p: LoyaltyProgram) => p.id === id) || null
  }

  const joinProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants.push(userId)
    program.userPoints[userId] = {
      points: 0,
      pointsHistory: []
    }
    
    updateProgram(programId, program)
    return true
  }

  const leaveProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants = program.participants.filter(id => id !== userId)
    delete program.userPoints[userId]
    
    updateProgram(programId, program)
    return true
  }

  const addPoints = (programId: string, userId: string, points: number, reason: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const userData = program.userPoints[userId]
    if (!userData) return false
    
    userData.points += points
    userData.pointsHistory.push({
      timestamp: Date.now(),
      points,
      reason
    })
    
    updateProgram(programId, program)
    return true
  }

  const redeemReward = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const userData = program.userPoints[userId]
    if (!userData || userData.points < program.pointsToReward) return false
    
    userData.points -= program.pointsToReward
    
    updateProgram(programId, program)
    return true
  }

  const getPointsBalance = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return 0
    
    return program.userPoints[userId]?.points || 0
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addPoints,
    redeemReward,
    getPointsBalance
  }
}