"use server"

import { redirect } from "next/navigation"
import { nanoid } from "nanoid"

export interface Product {
  name: string
  upc?: string
}

export interface MerchantProgram {
  id: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  status: "active" | "draft" | "paused"
  participants: string[] // Array of customer addresses who joined
  createdAt: string
  updatedAt?: string
  merchantAddress: string
  merchantName?: string
  isLocal?: boolean
  metadata: {
    requiredPunches?: number
    totalCoupons?: number
    rewardDescription?: string
    discountAmount?: string
    maxRedemptions?: number
    products?: Product[]
    expirationDate?: string | null
    privacy?: {
      isPublic?: boolean
      requiresApproval?: boolean
      allowsSharing?: boolean
    }
  }
}

export interface ProgramFormData {
  name: string
  description: string
  type: string
  expirationDate?: string
  requiredPunches?: number
  rewardDescription?: string
  discountAmount?: number
  selectedProducts?: Product[]
  isPublic?: boolean
  requiresApproval?: boolean
  allowsSharing?: boolean
  isActive: boolean
}

export interface CreateProgramFormData {
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  rewardDescription: string
  discountAmount?: string | undefined
  expirationDate?: string | undefined
  products: Product[]
  merchantName: string
  businessName: string
  requiredPunches?: number | undefined
  totalCoupons?: number | undefined
}

export interface LoyaltyProgram {
  id: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  rewardDescription: string
  discountAmount?: string | undefined
  expirationDate?: string | undefined
  products: Product[]
  merchantName: string
  businessName: string
  merchantAddress?: string | undefined
  requiredPunches?: number | undefined
  totalCoupons?: number | undefined
  createdAt: string
  isLocal?: boolean | undefined
  broadcastedToBSV?: boolean | undefined
}

/**
 * Create a loyalty program - Prepares data for BSV blockchain storage
 * TODO: Replace localStorage simulation with BSV Rust library calls
 */
export async function createProgram(
  formData: CreateProgramFormData | FormData,
): Promise<{ success: boolean; message?: string; programId?: string; program?: LoyaltyProgram }> {
  try {
    console.log("[Create Program] Starting program creation...")

    if (formData instanceof FormData) {
      // Server-side FormData processing
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const type = formData.get("type") as "punch-card" | "coupon-book"
      const rewardDescription = formData.get("rewardDescription") as string
      const expirationDate = formData.get("expirationDate") as string

      // Validation
      if (!name?.trim()) {
        return { success: false, message: "Program name is required" }
      }

      if (!description?.trim()) {
        return { success: false, message: "Program description is required" }
      }

      if (!rewardDescription?.trim()) {
        return { success: false, message: "Reward description is required" }
      }

      // Get wallet data from form (passed from client)
      const walletAddress = formData.get("walletAddress") as string
      const businessName = formData.get("businessName") as string

      if (!walletAddress) {
        return { success: false, message: "Wallet address is required" }
      }

      // Parse selected products if any
      let selectedProducts: Product[] = []
      const productsData = formData.get("selectedProducts") as string
      if (productsData) {
        try {
          const parsedProducts = JSON.parse(productsData)
          selectedProducts = parsedProducts.map((p: any) => ({
            name: p.name,
            upc: p.upc || undefined,
          }))
        } catch (error) {
          console.error("[Create Program] Error parsing selected products:", error)
        }
      }

      // Generate unique program ID (BSV transaction ID will replace this)
      const programId = `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Parse numeric values properly
      const requiredPunchesValue = formData.get("requiredPunches")
      const totalCouponsValue = formData.get("totalCoupons")
      const discountAmountValue = formData.get("discountAmount")

      // Build metadata object with proper types
      const metadata: MerchantProgram["metadata"] = {
        rewardDescription: rewardDescription.trim(),
        expirationDate: expirationDate || null,
      }

      // Only add products if we have any
      if (selectedProducts.length > 0) {
        metadata.products = selectedProducts
      }

      // Add type-specific metadata
      if (type === "punch-card" && requiredPunchesValue) {
        const requiredPunches = Number(requiredPunchesValue)
        if (!isNaN(requiredPunches) && requiredPunches > 0) {
          metadata.requiredPunches = requiredPunches
        }
      }

      if (type === "coupon-book") {
        if (totalCouponsValue) {
          const totalCoupons = Number(totalCouponsValue)
          if (!isNaN(totalCoupons) && totalCoupons > 0) {
            metadata.totalCoupons = totalCoupons
          }
        }
        if (discountAmountValue) {
          metadata.discountAmount = discountAmountValue as string
        }
      }

      // Create the program object with BSV-ready structure
      const newProgram: MerchantProgram = {
        id: programId,
        name: name.trim(),
        description: description.trim(),
        type,
        status: "active",
        participants: [], // Empty array initially - customers will join via BSV transactions
        createdAt: new Date().toISOString(),
        merchantAddress: walletAddress,
        merchantName: businessName || "Local Merchant",
        metadata,
      }

      console.log("[Create Program] Created program object:", newProgram)

      // TODO: Replace with BSV Rust library call
      // const bsvTxId = await bsv_rust::create_program(newProgram, merchantPrivateKey)
      // For now, simulate BSV transaction creation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[Create Program] ✅ Program created successfully:", programId)

      // Redirect to merchant dashboard with success message
      redirect("/merchant?created=true")
    } else {
      // Client-side creation (for direct API calls)
      console.log("🔥 Creating program with data:", formData)

      // Generate program ID (will be replaced by BSV transaction ID)
      const programId = `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      //const createdAt = new Date().toISOString()

      // Build metadata object with proper types
      const metadata: MerchantProgram["metadata"] = {
        rewardDescription: formData.rewardDescription,
        expirationDate: formData.expirationDate || null,
      }

      // Add type-specific metadata
      if (formData.type === "punch-card" && formData.requiredPunches) {
        metadata.requiredPunches = formData.requiredPunches
      }

      if (formData.type === "coupon-book") {
        if (formData.totalCoupons) {
          metadata.totalCoupons = formData.totalCoupons
        }
        if (formData.discountAmount) {
          metadata.discountAmount = formData.discountAmount
        }
      }

      // Convert products to proper format
      if (formData.products && formData.products.length > 0) {
        metadata.products = formData.products.map((p) => ({
          name: p.name,
          upc: p.upc ?? "",
        }))
      }

      // Create program object with BSV-ready structure
      const program: LoyaltyProgram = {
        id: nanoid(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        rewardDescription: formData.rewardDescription.trim(),
        discountAmount: formData.discountAmount?.trim() || undefined,
        expirationDate: formData.expirationDate,
        products: formData.products || [],
        merchantName: formData.merchantName.trim(),
        businessName: formData.businessName.trim(),
        createdAt: new Date().toISOString(),
        isLocal: true,
        broadcastedToBSV: false,
      }

      console.log("🔥 Program object created:", program)

      // TODO: In production, this will create a BSV transaction
      // const bsvTxId = await bsv_rust::create_program(program, merchantPrivateKey)

      return {
        success: true,
        program,
        programId,
        message: "Program created successfully!",
      }
    }

    return {
      success: true,
      message: "Program created successfully!",
    }
  } catch (error) {
    console.error("[Create Program] Error creating program:", error)
    return {
      success: false,
      message: "Failed to create program. Please try again.",
    }
  }
}

/**
 * Save program draft - Temporary storage before BSV commitment
 * TODO: Replace with BSV draft transaction or local encrypted storage
 */
export async function saveProgramDraft(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[Save Draft] Saving program draft...")

    // Get form data
    const name = formData.get("name") as string

    // Basic validation for draft
    if (!name?.trim()) {
      return { success: false, message: "Program name is required for draft" }
    }

    // TODO: In production, save draft to encrypted local storage or BSV draft transaction
    // For now, we'll simulate draft saving
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("[Save Draft] ✅ Draft saved successfully")

    return {
      success: true,
      message: "Draft saved successfully",
    }
  } catch (error) {
    console.error("[Save Draft] Error saving draft:", error)
    return {
      success: false,
      message: "Failed to save draft. Please try again.",
    }
  }
}

/**
 * Update existing program - Creates new BSV transaction with updated data
 * TODO: Replace with BSV Rust library call
 */
export async function updateProgram(
  programId: string,
  _updates: Partial<MerchantProgram>,
  _merchantPrivateKey: string,
): Promise<{ success: boolean; message: string; txId?: string }> {
  try {
    console.log(`[Update Program] Updating program ${programId}`)

    // TODO: Replace with BSV Rust library call
    // const bsvTxId = await bsv_rust::update_program(programId, updates, merchantPrivateKey)

    // Simulate BSV transaction
    await new Promise((resolve) => setTimeout(resolve, 800))
    const mockTxId = `update_${programId}_${Date.now()}`

    console.log(`[Update Program] ✅ Program updated successfully. TxId: ${mockTxId}`)

    return {
      success: true,
      message: "Program updated successfully",
      txId: mockTxId,
    }
  } catch (error) {
    console.error(`[Update Program] Error updating program ${programId}:`, error)
    return {
      success: false,
      message: "Failed to update program. Please try again.",
    }
  }
}

/**
 * Delete program - Creates BSV transaction to mark program as inactive
 * TODO: Replace with BSV Rust library call
 */
export async function deleteProgram(
  programId: string,
  _merchantPrivateKey: string,
): Promise<{ success: boolean; message: string; txId?: string }> {
  try {
    console.log(`[Delete Program] Deleting program ${programId}`)

    // TODO: Replace with BSV Rust library call
    // const bsvTxId = await bsv_rust::delete_program(programId, merchantPrivateKey)

    // Simulate BSV transaction
    await new Promise((resolve) => setTimeout(resolve, 600))
    const mockTxId = `delete_${programId}_${Date.now()}`

    console.log(`[Delete Program] ✅ Program deleted successfully. TxId: ${mockTxId}`)

    return {
      success: true,
      message: "Program deleted successfully",
      txId: mockTxId,
    }
  } catch (error) {
    console.error(`[Delete Program] Error deleting program ${programId}:`, error)
    return {
      success: false,
      message: "Failed to delete program. Please try again.",
    }
  }
}