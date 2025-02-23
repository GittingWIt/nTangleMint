import type { TieredProgram, TieredActions, Tier } from './types'
import type { ProgramAction } from '../types'

export const createTieredActions = (): ProgramAction<TieredProgram> & TieredActions => {
  const createProgram = (program: Omit<TieredProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: TieredProgram = {
      ...program,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tiers: [],
      userPoints: {},
      participants: []
    }
    
    // Save to localStorage
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.push(newProgram)
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return newProgram
  }

  const updateProgram = (id: string, updates: Partial<TieredProgram>) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const index = programs.findIndex((p: TieredProgram) => p.id === id)
    
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
    const filtered = programs.filter((p: TieredProgram) => p.id !== id)
    localStorage.setItem('programs', JSON.stringify(filtered))
    return true
  }

  const getProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    return programs.find((p: TieredProgram) => p.id === id) || null
  }

  const joinProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants.push(userId)
    program.userPoints[userId] = {
      points: 0,
      currentTier: program.tiers[0].id,
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

  const addTier = (programId: string, tier: Omit<Tier, 'id'>) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const newTier: Tier = {
      ...tier,
      id: crypto.randomUUID()
    }
    
    program.tiers.push(newTier)
    program.tiers.sort((a, b) => a.pointsRequired - b.pointsRequired)
    
    updateProgram(programId, program)
    return true
  }

  const removeTier = (programId: string, tierId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.tiers = program.tiers.filter(t => t.id !== tierId)
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
    
    // Update user's tier if necessary
    const newTier = program.tiers
      .filter(tier => tier.pointsRequired <= userData.points)
      .pop()
    
    if (newTier && newTier.id !== userData.currentTier) {
      userData.currentTier = newTier.id
    }
    
    updateProgram(programId, program)
    return true
  }

  const getUserTier = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return null
    
    const userData = program.userPoints[userId]
    if (!userData) return null
    
    return program.tiers.find(tier => tier.id === userData.currentTier) || null
  }

  const getPointsToNextTier = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return 0
    
    const userData = program.userPoints[userId]
    if (!userData) return 0
    
    const nextTier = program.tiers.find(tier => tier.pointsRequired > userData.points)
    if (!nextTier) return 0
    
    return nextTier.pointsRequired - userData.points
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addTier,
    removeTier,
    addPoints,
    getUserTier,
    getPointsToNextTier
  }
}