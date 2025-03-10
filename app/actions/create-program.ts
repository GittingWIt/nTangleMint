"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Program } from "@/types"

// Dummy function, replace with actual getServerWalletData function
async function getServerWalletData(): Promise<{ publicAddress: string; type: string } | null> {
  return null
}

export async function createCouponBookProgram(
  formData: FormData,
): Promise<{ success: true; programId: string } | { success: false; error: string }> {
  try {
    // Get wallet data from form data first
    let walletAddress = formData.get("walletAddress") as string
    let walletType = formData.get("walletType") as string

    if (!walletAddress || !walletType) {
      const serverWallet = await getServerWalletData()

      if (!serverWallet) {
        return {
          success: false,
          error: "No wallet data found. Please ensure your wallet is connected.",
        }
      }

      walletAddress = serverWallet.publicAddress
      walletType = serverWallet.type
    }

    const programId = `${walletAddress.substring(0, 8)}-${Date.now()}`

    const program: Program = {
      id: programId,
      type: "coupon-book",
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      merchantAddress: walletAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft", // Changed from 'active' to 'draft'
      version: 1,
      isPublic: false, // Changed from true to false
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

    // Set cookies for client-side sync with longer expiration and proper encoding
    const cookieStore = cookies()

    cookieStore.set("last_created_program", JSON.stringify(program), {
      maxAge: 60 * 60, // 1 hour
      path: "/",
      httpOnly: false, // Allow JavaScript access
      sameSite: "strict",
    })

    cookieStore.set("program_action", "create", {
      maxAge: 60 * 60, // 1 hour
      path: "/",
      httpOnly: false, // Allow JavaScript access
      sameSite: "strict",
    })

    // Revalidate paths
    revalidatePath("/merchant")
    revalidatePath("/merchant/dashboard")
    revalidatePath(`/merchant/programs/${programId}`)

    return { success: true, programId }
  } catch (error) {
    console.error("Failed to create program:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create program",
    }
  }
}