import type { CouponBookProgram, CouponBookActions } from './types'
import type { ProgramAction } from '../types'
import type { Coupon } from './types'; // Import the Coupon type

export const createCouponBookActions = (): ProgramAction<CouponBookProgram> & CouponBookActions => {
  const createProgram = (program: Omit<CouponBookProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: CouponBookProgram = {
      ...program,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coupons: [],
      userCoupons: {},
      participants: []
    }
    
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.push(newProgram)
    localStorage.setItem('programs', JSON.stringify(programs))
    
    return newProgram
  }

  const updateProgram = (id: string, updates: Partial<CouponBookProgram>) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const index = programs.findIndex((p: CouponBookProgram) => p.id === id)
    
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

  const getProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    return programs.find((p: CouponBookProgram) => p.id === id) || null
  }

  const deleteProgram = (id: string) => {
    const programs = JSON.parse(localStorage.getItem('programs') || '[]')
    const filtered = programs.filter((p: CouponBookProgram) => p.id !== id)
    localStorage.setItem('programs', JSON.stringify(filtered))
    return true
  }

  const joinProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants.push(userId)
    program.userCoupons[userId] = {}
    program.coupons.forEach(coupon => {
      program.userCoupons[userId][coupon.id] = {
        redeemed: false
      }
    })
    
    updateProgram(programId, program)
    return true
  }

  const leaveProgram = (programId: string, userId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.participants = program.participants.filter(id => id !== userId)
    delete program.userCoupons[userId]
    
    updateProgram(programId, program)
    return true
  }

  const addCoupon = (programId: string, coupon: Omit<Coupon, 'id' | 'currentUses'>) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const newCoupon = {
      ...coupon,
      id: crypto.randomUUID(),
      currentUses: 0
    }
    
    program.coupons.push(newCoupon)
    program.participants.forEach(userId => {
      if (!program.userCoupons[userId]) {
        program.userCoupons[userId] = {}
      }
      program.userCoupons[userId][newCoupon.id] = {
        redeemed: false
      }
    })
    
    updateProgram(programId, program)
    return true
  }

  const removeCoupon = (programId: string, couponId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    program.coupons = program.coupons.filter(c => c.id !== couponId)
    Object.keys(program.userCoupons).forEach(userId => {
      delete program.userCoupons[userId][couponId]
    })
    
    updateProgram(programId, program)
    return true
  }

  const redeemCoupon = (programId: string, userId: string, couponId: string) => {
    const program = getProgram(programId)
    if (!program) return false
    
    const coupon = program.coupons.find(c => c.id === couponId)
    if (!coupon) return false
    
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return false
    if (coupon.expiryDate && Date.now() > coupon.expiryDate) return false
    
    const userCoupon = program.userCoupons[userId]?.[couponId]
    if (!userCoupon || userCoupon.redeemed) return false
    
    program.userCoupons[userId][couponId] = {
      redeemed: true,
      redeemedAt: Date.now()
    }
    coupon.currentUses++
    
    updateProgram(programId, program)
    return true
  }

  const getCouponStatus = (programId: string, userId: string, couponId: string) => {
    const program = getProgram(programId)
    if (!program) return null
    
    return program.userCoupons[userId]?.[couponId] || null
  }

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addCoupon,
    removeCoupon,
    redeemCoupon,
    getCouponStatus
  }
}