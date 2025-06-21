"use client"

import { useState, useEffect, useRef } from "react"
import { getPrograms, updateProgram, getWalletData, setWalletData } from "@/lib/storage-compat"
import safeStorage from "@/lib/safe-storage"
import { debug } from "@/lib/debug"
import { storageService } from "@/lib/storage-service-compat"
import type { Program, ProgramType, ProgramStatus } from "@/types" // Import Program interface

declare global {
  interface Window {
    _processingCoupon?: boolean
  }
}

// Define a type for wallet data to help TypeScript understand the structure
interface WalletData {
  publicAddress?: string
  type?: string
  [key: string]: any // Allow for other properties
}

// Define a type for coupon program - now exported to fix the TypeScript error
export interface CouponProgram {
  id: string
  name?: string
  description?: string
  metadata?: {
    expirationDate?: string | Date
    discountAmount?: string | number
    discountType?: string
    [key: string]: any
  }
  [key: string]: any // Allow for other properties that might exist
}

// Define a custom event type for coupon clipped events
interface CouponClippedEvent extends CustomEvent {
  detail: {
    couponId: string
    userId: string
    merchantAddress: string
  }
}

// Custom UUID generator function
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Simple toast implementation
const toast = {
  success: (message: string) => {
    console.log(`Success: ${message}`)
    if (typeof window !== "undefined") {
      alert(`Success: ${message}`)
    }
  },
  error: (message: string) => {
    console.error(`Error: ${message}`)
    if (typeof window !== "undefined") {
      alert(`Error: ${message}`)
    }
  },
  info: (message: string) => {
    console.info(`Info: ${message}`)
    if (typeof window !== "undefined") {
      alert(`Info: ${message}`)
    }
  },
}

export function CouponHandler() {
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true)
  const [couponId, setCouponId] = useState("")
  const [discount, setDiscount] = useState(0)
  const [walletData, setWalletState] = useState<any>(null)
  const [program, setProgram] = useState<any>(null)
  const [allPrograms, setAllPrograms] = useState<any[]>([])

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Create a more efficient event handler
    const handleCouponClipped = async (event: Event) => {
      // Cast the event to our custom event type
      const customEvent = event as CouponClippedEvent
      const { couponId, userId, merchantAddress } = customEvent.detail
      debug("Coupon clipped event received:", { couponId, userId, merchantAddress })

      // Add debouncing to prevent multiple rapid executions
      if (window._processingCoupon) {
        console.log("Already processing a coupon, skipping")
        return
      }

      window._processingCoupon = true

      try {
        // Get the current wallet data with timeout
        const walletDataPromise = Promise.resolve(getWalletData())
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Wallet data fetch timeout")), 1000),
        )

        const walletData = (await Promise.race([walletDataPromise, timeoutPromise]).catch((err) => {
          console.error("Error fetching wallet data:", err)
          return null
        })) as WalletData | null

        // Type-safe check for wallet data and publicAddress
        if (!walletData || typeof walletData.publicAddress !== "string") {
          console.error("No wallet data found")
          window._processingCoupon = false
          return
        }

        // Verify this is the correct user
        if (walletData.publicAddress !== userId) {
          console.error("User ID mismatch")
          window._processingCoupon = false
          return
        }

        // Get the coupon details from storage - with performance optimization
        const allPrograms = getPrograms()
        const couponProgram = allPrograms.find((p: Program) => p.id === couponId)

        if (!couponProgram) {
          console.error("Coupon not found in programs")
          window._processingCoupon = false
          return
        }

        // Get expiration date with type safety
        const getExpirationDate = () => {
          // Check if expirationDate exists on the program
          if ("expirationDate" in couponProgram && couponProgram.expirationDate) {
            return couponProgram.expirationDate
          }

          // Check if it exists in metadata
          if (couponProgram.metadata?.expirationDate) {
            return couponProgram.metadata.expirationDate
          }

          // Default: 30 days from now
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        // Get discount info with type safety
        const getDiscountInfo = () => {
          if (couponProgram.metadata?.discountAmount) {
            const discountType = couponProgram.metadata.discountType === "percentage" ? "%" : "$"
            return `${couponProgram.metadata.discountAmount}${discountType} off`
          }
          return "Special offer"
        }

        // Create the user coupon object
        const couponStatus: ProgramStatus = "active" as ProgramStatus
        const couponType: ProgramType = "coupon-book" as ProgramType

        const userCoupon = {
          id: couponId,
          name: couponProgram.name || "Unnamed Coupon",
          description: couponProgram.description || "",
          merchantAddress: merchantAddress,
          clippedAt: new Date().toISOString(),
          expirationDate: getExpirationDate(),
          discount: getDiscountInfo(),
          status: couponStatus,
          type: couponType,
          metadata: couponProgram.metadata || {},
        }

        // DIRECT APPROACH: Save to user coupons - with optimized storage access
        const userCouponsKey = `user-coupons-${userId}`
        let userCoupons = []

        // Use a more efficient try-catch block
        const existingCouponsStr = safeStorage.getItem(userCouponsKey)
        if (existingCouponsStr) {
          try {
            userCoupons = JSON.parse(existingCouponsStr)
          } catch {
            // If parsing fails, just use an empty array
            userCoupons = []
          }
        }

        // Check if coupon is already clipped
        const alreadyClipped = userCoupons.some((c: any) => c.id === couponId)
        if (alreadyClipped) {
          console.log("Coupon already clipped, skipping")
          window._processingCoupon = false
          return
        }

        // Add the new coupon
        userCoupons.push(userCoupon)

        // Save back to storage - with batched writes
        try {
          safeStorage.setItem(userCouponsKey, JSON.stringify(userCoupons))
          console.log("Saved user coupons:", userCoupons)
        } catch (error) {
          console.error("Error saving user coupons:", error)
          window._processingCoupon = false
          return
        }

        // ALSO UPDATE PROGRAM PARTICIPANTS
        try {
          // Get the program
          const programs = getPrograms()
          const programToUpdate = programs.find((p: Program) => p.id === couponId)

          if (programToUpdate) {
            // Initialize participants array if it doesn't exist
            if (!programToUpdate.participants) {
              programToUpdate.participants = []
            }

            // Add user to participants if not already there
            if (!programToUpdate.participants.includes(userId)) {
              programToUpdate.participants.push(userId)

              // Update the program
              updateProgram(couponId, {
                participants: programToUpdate.participants,
              })

              console.log("Updated program participants:", programToUpdate.participants)
            }
          }
        } catch (error) {
          console.error("Error updating program participants:", error)
          // Continue anyway since the coupon was already clipped
        }

        // Only dispatch events if the component is still mounted
        if (isMounted.current) {
          // Dispatch an event to notify that storage has been updated
          window.dispatchEvent(
            new CustomEvent("storageUpdated", {
              detail: { userId, type: "coupon" },
            }),
          )

          // If we're on the user dashboard, update without full reload
          if (window.location.pathname === "/user") {
            // Just dispatch an event instead of reloading
            window.dispatchEvent(
              new CustomEvent("dashboardRefresh", {
                detail: { userId, type: "coupon" },
              }),
            )
          }

          // Dispatch an event to notify that program participants have been updated
          window.dispatchEvent(
            new CustomEvent("programUpdated", {
              detail: { programId: couponId, userId, type: "join" },
            }),
          )
        }
      } catch (error) {
        console.error("Error processing clipped coupon:", error)
      } finally {
        // Always clear the processing flag
        setTimeout(() => {
          window._processingCoupon = false
        }, 200) // Reduced from 300ms to 200ms for better performance
      }
    }

    // Add event listener - no type assertion needed now
    window.addEventListener("couponClipped", handleCouponClipped)

    // Load wallet data using our compatibility layer
    const loadWalletData = async () => {
      try {
        const data = await getWalletData()
        setWalletState(data)
      } catch (error) {
        console.error("Error loading wallet data:", error)
      }
    }

    loadWalletData()

    // Ensure allPrograms is always an array
    const programs = getPrograms()
    setAllPrograms(Array.isArray(programs) ? programs : [])

    // Clean up
    return () => {
      isMounted.current = false
      window.removeEventListener("couponClipped", handleCouponClipped)
      // Ensure we clear the processing flag on unmount
      window._processingCoupon = false
    }
  }, [])

  const handleCouponIdChange = (e: any) => {
    setCouponId(e.target.value)
  }

  const handleDiscountChange = (e: any) => {
    setDiscount(Number.parseInt(e.target.value))
  }

  const handleCreateCoupon = () => {
    if (!discount) {
      toast.error("Discount cannot be empty")
      return
    }

    // Define status with explicit type casting
    const programStatus: ProgramStatus = "active" as ProgramStatus
    const programType: ProgramType = "coupon-book" as ProgramType

    const newProgram: Program = {
      id: uuidv4(),
      name: "Discount Coupon",
      description: `${discount}% off your purchase`,
      merchantAddress: storageService.getMerchantAddress(),
      status: programStatus,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [],
      type: programType,
      metadata: {
        discountAmount: discount.toString(), // Convert number to string
        discountType: "percentage",
        type: "coupon",
      },
      discount: `${discount}% off`,
    }

    // Use addProgram from storage-compat
    storageService.saveProgram(newProgram)

    // Update local state
    setAllPrograms(getPrograms())
    toast.success("Coupon created successfully")
  }

  const handleGetCoupon = () => {
    if (!couponId) {
      toast.error("Coupon ID cannot be empty")
      return
    }

    const program = storageService.getProgramById(couponId)

    if (!program) {
      toast.error("Coupon not found")
      return
    }

    setProgram(program)
    toast.success("Coupon fetched successfully")
  }

  const handleApplyCoupon = () => {
    if (!couponId) {
      toast.error("Coupon ID cannot be empty")
      return
    }

    const program = storageService.getProgramById(couponId)

    if (!program) {
      toast.error("Coupon not found")
      return
    }

    if (!walletData) {
      toast.error("Wallet data not found")
      return
    }

    const updatedWalletData = {
      ...walletData,
      balance: walletData.balance - (Number(program.metadata?.discountAmount) || 0),
    }

    // Use setWalletData from storage-compat
    setWalletData(updatedWalletData)
    setWalletState(updatedWalletData)
    toast.success("Coupon applied successfully")
  }

  // This component doesn't render anything
  return (
    <div>
      <h1>Coupon Handler</h1>

      <div>
        <h2>Create Coupon</h2>
        <input type="number" placeholder="Discount" value={discount} onChange={handleDiscountChange} />
        <button onClick={handleCreateCoupon}>Create Coupon</button>
      </div>

      <div>
        <h2>Get Coupon</h2>
        <input type="text" placeholder="Coupon ID" value={couponId} onChange={handleCouponIdChange} />
        <button onClick={handleGetCoupon}>Get Coupon</button>
        {program && (
          <div>
            <h3>Coupon Details</h3>
            <p>ID: {program.id}</p>
            <p>Name: {program.name}</p>
            <p>
              Discount: {program.metadata?.discountAmount}
              {program.metadata?.discountType === "percentage" ? "%" : "$"}
            </p>
          </div>
        )}
      </div>

      <div>
        <h2>Apply Coupon</h2>
        <input type="text" placeholder="Coupon ID" value={couponId} onChange={handleCouponIdChange} />
        <button onClick={handleApplyCoupon}>Apply Coupon</button>
      </div>

      <div>
        <h2>Wallet Data</h2>
        {walletData && (
          <div>
            <p>Address: {walletData.publicAddress}</p>
            <p>Type: {walletData.type}</p>
            <p>Balance: {walletData.balance || "N/A"}</p>
          </div>
        )}
      </div>

      <div>
        <h2>All Programs</h2>
        {Array.isArray(allPrograms) && allPrograms.length > 0 ? (
          allPrograms.map((program: any) => (
            <div key={program.id} className="p-2 border-b">
              <p>
                <strong>ID:</strong> {program.id}
              </p>
              <p>
                <strong>Name:</strong> {program.name || "Unnamed"}
              </p>
              <p>
                <strong>Type:</strong> {program.type || "Unknown"}
              </p>
              <p>
                <strong>Discount:</strong> {program.metadata?.discountAmount}
                {program.metadata?.discountType === "percentage" ? "%" : "$"}
              </p>
            </div>
          ))
        ) : (
          <p>No programs available</p>
        )}
      </div>
    </div>
  )
}