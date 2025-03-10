"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getWalletData, addProgram } from "@/lib/storage"
import type { Program } from "@/types"

export async function createOrUpdateProgram(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const wallet = await getWalletData()
    if (!wallet) {
      return { success: false, error: "No wallet data found" }
    }

    const programId = (formData.get("id") as string) || `${wallet.publicAddress.substring(0, 8)}-${Date.now()}`
    const program: Program = {
      id: programId,
      type: "coupon-book",
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      merchantAddress: wallet.publicAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      version: 1,
      isPublic: true,
      metadata: {
        discountAmount: formData.get("discountAmount") as string,
        discountType: "fixed",
        expirationDate: formData.get("expirationDate") as string,
        upcCodes: (formData.get("upcCodes") as string).split(","),
      },
      stats: {
        participantCount: 0,
        rewardsIssued: 0,
        rewardsRedeemed: 0,
        totalValue: 0,
      },
    }

    await addProgram(program)

    // Set cookie to trigger client-side update
    cookies().set("last_modified_program", programId, { maxAge: 30 })

    // Revalidate paths
    revalidatePath("/merchant")
    revalidatePath(`/merchant/programs/${programId}`)

    return { success: true }
  } catch (error) {
    console.error("Failed to save program:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save program",
    }
  }
}