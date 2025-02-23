import type { PartnershipsProgram, PartnershipsActions, Partner } from './types'
import type { ProgramAction } from '../types'

export const createPartnershipsActions = (): ProgramAction<PartnershipsProgram> & PartnershipsActions => {
  const createProgram = (program: Omit<PartnershipsProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: PartnershipsProgram = {
      ...program,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      partners: [],
      userPoints: {},
      participants: []
    }
    
    // Save to localStorage
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.push(newProgram)
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return newProgram
  }

  const updateProgram = (id: string, updates: Partial<PartnershipsProgram>) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const index = programs.findIndex((p: PartnershipsProgram) => p.id === id)
    
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
    const filtered = programs.filter((p: PartnershipsProgram) => p.id !== id)
    localStorage.setItem('programs', JSON.stringify(filtered))
    return true
  }

  const getProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    return programs.find((p: PartnershipsProgram) => p.id === id) || null
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

  const addPartner = (programId: string, partner: Omit<Partner, 'id'>) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const newPartner: Partner = {
      ...partner,
      id: crypto.randomUUID()
    }
    
    program.partners.push(newPartner)
    updateProgram(programId, program)
    return true
  }

  const removePartner = (programId: string, partnerId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.partners = program.partners.filter(p => p.id !== partnerId)
    updateProgram(programId, program)
    return true
  }

  const addPoints = (programId: string, userId: string, points: number, partnerId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const userData = program.userPoints[userId]
    if (!userData) return false
    
    const partner = program.partners.find(p => p.id === partnerId)
    if (!partner) return false
    
    const adjustedPoints = points * partner.pointsMultiplier
    
    userData.points += adjustedPoints
    userData.pointsHistory.push({
      timestamp: Date.now(),
      points: adjustedPoints,
      partnerId
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
    addPartner,
    removePartner,
    addPoints,
    redeemReward,
    getPointsBalance
  }
}