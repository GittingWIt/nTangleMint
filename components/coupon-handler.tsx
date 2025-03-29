"use client"

import { useEffect, useRef } from "react"
import { debug } from "@/lib/debug"
import { getWalletData } from "@/lib/storage"
import { getDirectProgramsFromStorage } from "@/lib/direct-storage-access"

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

// Define a type for coupon program
interface CouponProgram {
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

export function CouponHandler() {
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true)

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
        const walletDataPromise = getWalletData()
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
        const allPrograms = getDirectProgramsFromStorage()
        const couponProgram = allPrograms.find((p: any) => p.id === couponId) as CouponProgram | undefined

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
        const userCoupon = {
          id: couponId,
          name: couponProgram.name || "Unnamed Coupon",
          description: couponProgram.description || "",
          merchantAddress: merchantAddress,
          clippedAt: new Date().toISOString(),
          expirationDate: getExpirationDate(),
          discount: getDiscountInfo(),
          status: "active",
          type: "coupon-book",
          metadata: couponProgram.metadata || {},
        }

        // DIRECT APPROACH: Save to user coupons - with optimized storage access
        const userCouponsKey = `user-coupons-${userId}`
        let userCoupons = []

        // Use a more efficient try-catch block
        const existingCouponsStr = localStorage.getItem(userCouponsKey)
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

        // Save back to localStorage - with batched writes
        try {
          localStorage.setItem(userCouponsKey, JSON.stringify(userCoupons))
          console.log("Saved user coupons:", userCoupons)
        } catch (error) {
          console.error("Error saving user coupons:", error)
          window._processingCoupon = false
          return
        }

        // ALSO UPDATE PROGRAM PARTICIPANTS
        try {
          // Get all programs
          const programsStr = localStorage.getItem("programs")
          if (programsStr) {
            const programs = JSON.parse(programsStr)
            const programIndex = programs.findIndex((p: any) => p.id === couponId)

            if (programIndex !== -1) {
              // Initialize participants array if it doesn't exist
              if (!programs[programIndex].participants) {
                programs[programIndex].participants = []
              }

              // Add user to participants if not already there
              if (!programs[programIndex].participants.includes(userId)) {
                programs[programIndex].participants.push(userId)
                localStorage.setItem("programs", JSON.stringify(programs))
                console.log("Updated program participants:", programs[programIndex].participants)
              }
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

    // Clean up
    return () => {
      isMounted.current = false
      window.removeEventListener("couponClipped", handleCouponClipped)
      // Ensure we clear the processing flag on unmount
      window._processingCoupon = false
    }
  }, [])

  // This component doesn't render anything
  return null
}