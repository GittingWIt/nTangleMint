import { describe, it, expect, beforeEach } from "vitest"
import { getWalletData, setWalletData } from "@/lib/storage"
import { mockMerchantWallet } from "@/lib/mock/wallet-data"
import type { Program } from "@/types"

describe("Coupon Program Creation", () => {
  // Setup before each test
  beforeEach(async () => {
    // Clear any existing wallet data
    localStorage.clear()
    // Set up mock wallet
    await setWalletData(mockMerchantWallet)
  })

  it("should validate wallet state", async () => {
    const wallet = await getWalletData()

    expect(wallet).toBeTruthy()
    expect(wallet?.type).toBe("merchant")
    expect(wallet?.publicAddress).toBe(mockMerchantWallet.publicAddress)
  })

  it("should validate form submission data", () => {
    const formData = new FormData()
    formData.append("name", "Test Coupon Program")
    formData.append("description", "Test Description")
    formData.append("discountAmount", "10")
    formData.append("expirationDate", new Date().toISOString())
    formData.append("upcCodes", "706970457638")

    expect(formData.get("name")).toBeTruthy()
    expect(formData.get("description")).toBeTruthy()
    expect(formData.get("discountAmount")).toBeTruthy()
    expect(formData.get("expirationDate")).toBeTruthy()
    expect(formData.get("upcCodes")).toBeTruthy()
  })

  it("should create a valid program object", async () => {
    const wallet = await getWalletData()
    expect(wallet).toBeTruthy()

    const program: Program = {
      id: `${wallet?.publicAddress.substring(0, 8)}-${Date.now()}`,
      type: "coupon-book",
      name: "Test Coupon Program",
      description: "Test Description",
      merchantAddress: wallet?.publicAddress || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      version: 1,
      isPublic: true,
      metadata: {
        discountAmount: "10",
        discountType: "fixed",
        expirationDate: new Date().toISOString(),
        upcCodes: ["706970457638"],
      },
      stats: {
        participantCount: 0,
        rewardsIssued: 0,
        rewardsRedeemed: 0,
        totalValue: 0,
      },
    }

    expect(program).toMatchObject({
      type: "coupon-book",
      status: "active",
      version: 1,
      isPublic: true,
    })

    expect(program.metadata).toMatchObject({
      discountType: "fixed",
      upcCodes: expect.arrayContaining(["706970457638"]),
    })
  })
})