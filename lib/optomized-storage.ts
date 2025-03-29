/**
 * Simplified optimized storage utilities
 */

// Import the direct storage access functions to maintain compatibility
import { getCouponPrograms as getDirectCouponPrograms } from "@/lib/direct-storage-access"

// Export the functions from direct-storage-access to maintain compatibility
export const getCouponPrograms = getDirectCouponPrograms
export const ensureDefaultData = () => {
  // This is a simplified version that does nothing
  console.log("ensureDefaultData called")
}
export const initStorageCache = () => {
  // This is a simplified version that does nothing
  console.log("initStorageCache called")
}
export const getUserCoupons = (userId: string) => {
  if (!userId) return []

  try {
    const userCouponsKey = `user-coupons-${userId}`
    const couponsStr = localStorage.getItem(userCouponsKey) || "[]"
    return JSON.parse(couponsStr)
  } catch (error) {
    console.error("Error getting user coupons:", error)
    return []
  }
}

/**
 * Optimized storage utilities to improve performance
 */

// Cache for frequently accessed data
const storageCache: Record<string, any> = {}
const cacheInitialized = false

/**
 * Get data from storage with caching
 * @param key Storage key
 * @param defaultValue Default value if not found
 * @returns Parsed data or default value
 */
export function getStorageData<T>(key: string, defaultValue: T): T {
  // Try cache first
  if (storageCache[key] !== undefined) {
    return storageCache[key] as T
  }

  try {
    const value = localStorage.getItem(key)
    if (!value) return defaultValue

    try {
      const parsed = JSON.parse(value)
      storageCache[key] = parsed // Update cache
      return parsed as T
    } catch {
      return defaultValue
    }
  } catch (error) {
    console.error(`Error getting storage data for key ${key}:`, error)
    return defaultValue
  }
}

/**
 * Set data to storage with caching
 * @param key Storage key
 * @param value Value to store
 */
export function setStorageData(key: string, value: any): boolean {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, stringValue)
    storageCache[key] = value // Update cache
    return true
  } catch (error) {
    console.error(`Error setting storage data for key ${key}:`, error)
    return false
  }
}

/**
 * Get all programs from storage
 * @returns Array of programs
 */
export function getAllPrograms() {
  return getStorageData("programs", [])
}

/**
 * Add a coupon to user's clipped coupons
 * @param userId User ID
 * @param coupon Coupon to add
 * @returns Success status
 */
export function addUserCoupon(userId: string, coupon: any): boolean {
  if (!userId || !coupon) return false

  try {
    const key = `user-coupons-${userId}`
    const userCoupons = getUserCoupons(userId)

    // Check if already exists
    if (userCoupons.some((c: any) => c.id === coupon.id)) {
      return true // Already exists, consider it success
    }

    // Add coupon
    userCoupons.push(coupon)

    // Save back to storage
    return setStorageData(key, userCoupons)
  } catch (error) {
    console.error("Error adding user coupon:", error)
    return false
  }
}

/**
 * Create a default coupon if none exist
 * @returns Default coupon object
 */
export function createDefaultCoupon() {
  const id = `default-coupon-${Date.now()}`

  return {
    id,
    name: "Summer Discount",
    description: "Save 10% on Freeze Dried Strawberries.",
    merchantAddress: "19jXXizm7VynAU73xcu3RpkSQKjZQer",
    merchantName: "Local Grocery",
    type: "coupon-book",
    status: "active",
    isPublic: true,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      discountType: "percentage",
      discountAmount: 10,
      type: "coupon",
    },
  }
}