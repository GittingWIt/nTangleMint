"use server"

import type {
  CouponBookProgram,
  Coupon,
  CouponBookActions,
  UserCoupon,
  CouponCreateData,
  CouponUpdateData,
} from "./types"
import type { ProgramAction } from "../types"
import { couponBookUtils } from "./utils"
import { revalidatePath } from "next/cache"

interface StorageOperations {
  getPrograms: () => CouponBookProgram[]
  savePrograms: (programs: CouponBookProgram[]) => void
  getProgram: (id: string) => CouponBookProgram | null
}

const storage: StorageOperations = {
  getPrograms: () => {
    try {
      if (typeof window !== "undefined") {
        const programs = localStorage.getItem("programs")
        return programs ? JSON.parse(programs) : []
      }
      return []
    } catch (error) {
      console.error("Error getting programs:", error)
      return []
    }
  },

  savePrograms: (programs: CouponBookProgram[]) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("programs", JSON.stringify(programs))
      }
    } catch (error) {
      console.error("Error saving programs:", error)
      throw new Error("Failed to save programs")
    }
  },

  getProgram: (id: string) => {
    try {
      const programs = storage.getPrograms()
      return programs.find((p: CouponBookProgram) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },
}

export const createCouponBookActions = () => {
  const createProgram = async (
    program: Omit<CouponBookProgram, "id" | "createdAt" | "updatedAt" | "type">,
  ): Promise<CouponBookProgram> => {
    try {
      const newProgram: CouponBookProgram = {
        ...program,
        type: "coupon-book",
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coupons: [],
        userCoupons: {},
        participants: [],
        businessName: program.businessName,
        name: program.name,
        description: program.description,
        category: program.category || "general",
        terms: program.terms || "",
        isActive: program.isActive ?? true,
        merchantId: program.merchantId,
      }

      if (!couponBookUtils.validateProgram(newProgram)) {
        throw new Error("Invalid program data")
      }

      const programs = storage.getPrograms()
      programs.push(newProgram)
      storage.savePrograms(programs)
      revalidatePath("/merchant/programs")

      return newProgram
    } catch (error) {
      console.error("Error creating program:", error)
      throw new Error("Failed to create program")
    }
  }

  const updateProgram = async (id: string, updates: Partial<CouponBookProgram>): Promise<CouponBookProgram> => {
    try {
      const programs = storage.getPrograms()
      const index = programs.findIndex((p: CouponBookProgram) => p.id === id)

      if (index === -1) throw new Error("Program not found")

      const currentProgram = programs[index]
      if (!currentProgram) throw new Error("Program not found")

      const updatedProgram: CouponBookProgram = {
        ...currentProgram,
        ...updates,
        type: "coupon-book",
        updatedAt: Date.now(),
      }

      if (!couponBookUtils.validateProgram(updatedProgram)) {
        throw new Error("Invalid program data")
      }

      programs[index] = updatedProgram
      storage.savePrograms(programs)
      revalidatePath("/merchant/programs")

      return updatedProgram
    } catch (error) {
      console.error("Error updating program:", error)
      throw new Error("Failed to update program")
    }
  }

  const deleteProgram = async (id: string): Promise<boolean> => {
    try {
      const programs = storage.getPrograms()
      const filtered = programs.filter((p: CouponBookProgram) => p.id !== id)
      storage.savePrograms(filtered)
      revalidatePath("/merchant/programs")
      return true
    } catch (error) {
      console.error("Error deleting program:", error)
      return false
    }
  }

  const getProgram = async (id: string): Promise<CouponBookProgram | null> => {
    try {
      return storage.getProgram(id)
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  }

  const joinProgram = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      if (!program.participants.includes(userId)) {
        program.participants.push(userId)
      }

      if (!program.userCoupons) {
        program.userCoupons = {}
      }

      if (!program.userCoupons[userId]) {
        program.userCoupons[userId] = {}
      }

      program.coupons.forEach((coupon: Coupon) => {
        const userCoupons = program.userCoupons[userId]
        if (userCoupons && typeof userCoupons === "object") {
          userCoupons[coupon.id] = {
            redeemed: false,
            redeemedAt: null,
          }
        }
      })

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error joining program:", error)
      return false
    }
  }

  const leaveProgram = async (programId: string, userId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      program.participants = program.participants.filter((id) => id !== userId)
      delete program.userCoupons[userId]

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error leaving program:", error)
      return false
    }
  }

  const addCoupon = async (programId: string, couponData: CouponCreateData): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const newCoupon: Coupon = {
        id: crypto.randomUUID(),
        title: couponData.title,
        description: couponData.description,
        discountValue: couponData.discountValue,
        discountType: couponData.discountType,
        currentUses: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiryDate: couponData.expiryDate ?? null,
        maxUses: couponData.maxUses ?? null,
        terms: couponData.terms ?? null,
        image: couponData.image ?? null,
        upcCodes: couponData.upcCodes ?? null,
        isActive: couponData.isActive ?? true,
      }

      program.coupons.push(newCoupon)

      // Initialize userCoupons for the new coupon
      for (const userId in program.userCoupons) {
        const userCoupons = program.userCoupons[userId]
        if (userCoupons && typeof userCoupons === "object") {
          userCoupons[newCoupon.id] = {
            redeemed: false,
            redeemedAt: null,
          }
        }
      }

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error adding coupon:", error)
      return false
    }
  }

  const updateCoupon = async (programId: string, couponId: string, updates: CouponUpdateData): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const couponIndex = program.coupons.findIndex((c) => c.id === couponId)
      if (couponIndex === -1) return false

      const existingCoupon = program.coupons[couponIndex]
      if (!existingCoupon) return false

      const updatedCoupon: Coupon = {
        id: existingCoupon.id,
        title: updates.title ?? existingCoupon.title,
        description: updates.description ?? existingCoupon.description,
        discountValue: updates.discountValue ?? existingCoupon.discountValue,
        discountType: updates.discountType ?? existingCoupon.discountType,
        currentUses: existingCoupon.currentUses,
        createdAt: existingCoupon.createdAt,
        updatedAt: Date.now(),
        expiryDate: updates.expiryDate ?? existingCoupon.expiryDate,
        maxUses: updates.maxUses ?? existingCoupon.maxUses,
        terms: updates.terms ?? existingCoupon.terms,
        image: updates.image ?? existingCoupon.image,
        upcCodes: updates.upcCodes ?? existingCoupon.upcCodes,
        isActive: updates.isActive ?? existingCoupon.isActive,
      }

      program.coupons[couponIndex] = updatedCoupon

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error updating coupon:", error)
      return false
    }
  }

  const removeCoupon = async (programId: string, couponId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      program.coupons = program.coupons.filter((coupon) => coupon.id !== couponId)

      for (const userId in program.userCoupons) {
        const userCoupons = program.userCoupons[userId]
        if (userCoupons && typeof userCoupons === "object") {
          delete userCoupons[couponId]
        }
      }

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error removing coupon:", error)
      return false
    }
  }

  const redeemCoupon = async (programId: string, userId: string, couponId: string): Promise<boolean> => {
    try {
      const program = await getProgram(programId)
      if (!program) return false

      const userCoupons = program.userCoupons[userId]
      if (!userCoupons || !userCoupons[couponId]) {
        console.warn("Coupon not found for user")
        return false
      }

      if (userCoupons[couponId]?.redeemed) {
        console.warn("Coupon already redeemed")
        return false
      }

      const coupon = program.coupons.find((c) => c.id === couponId)
      if (!coupon) {
        console.warn("Coupon not found")
        return false
      }

      if (!coupon || !couponBookUtils?.isCouponValid?.(coupon)) {
        console.warn("Coupon is not valid")
        return false
      }

      userCoupons[couponId] = {
        redeemed: true,
        redeemedAt: Date.now(),
      }

      coupon.currentUses = (coupon.currentUses || 0) + 1

      await updateProgram(programId, program)
      return true
    } catch (error) {
      console.error("Error redeeming coupon:", error)
      return false
    }
  }

  const getCouponStatus = async (
    programId: string,
    userId: string,
    couponId: string,
  ): Promise<{ redeemed: boolean; redeemedAt: number | null } | null> => {
    try {
      const program = await getProgram(programId)
      if (!program) return null

      const userCoupon = program.userCoupons[userId]?.[couponId]
      if (!userCoupon) return null

      return {
        redeemed: userCoupon.redeemed,
        redeemedAt: userCoupon.redeemedAt ?? null,
      }
    } catch (error) {
      console.error("Error getting coupon status:", error)
      return null
    }
  }

  const getCoupons = async (programId: string): Promise<Coupon[]> => {
    try {
      const program = await getProgram(programId)
      if (!program) return []
      return program.coupons
    } catch (error) {
      console.error("Error getting coupons:", error)
      return []
    }
  }

  const getUserCoupons = async (
    programId: string,
    userId: string,
  ): Promise<{ coupon: Coupon; status: UserCoupon }[]> => {
    try {
      const program = await getProgram(programId)
      if (!program) return []

      const userCoupons = program.userCoupons[userId]
      if (!userCoupons) return []

      return program.coupons
        .filter((coupon) => userCoupons[coupon.id])
        .map((coupon) => {
          const status = userCoupons[coupon.id]
          if (!status) {
            // Provide default UserCoupon if somehow missing
            return {
              coupon,
              status: {
                redeemed: false,
                redeemedAt: null,
              },
            }
          }
          return {
            coupon,
            status,
          }
        })
    } catch (error) {
      console.error("Error getting user coupons:", error)
      return []
    }
  }

  const actions = {
    createProgram,
    updateProgram,
    deleteProgram,
    getProgram,
    joinProgram,
    leaveProgram,
    addCoupon,
    updateCoupon,
    removeCoupon,
    redeemCoupon,
    getCouponStatus,
    getCoupons,
    getUserCoupons,
  }

  return actions satisfies ProgramAction<CouponBookProgram> & CouponBookActions
}