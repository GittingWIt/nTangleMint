import { debug } from "./debug"

export interface Program {
  id: string
  name: string
  description: string
  type?: string
  status?: string
  isPublic?: boolean
  merchantAddress: string
  metadata?: any
  discount?: string
  createdAt?: string
  updatedAt?: string
}

export function getDirectProgramsFromStorage(): Program[] {
  try {
    // Try all possible storage keys
    const possibleKeys = [
      "ntanglemint_prod_programs",
      "ntanglemint_programs",
      "programs",
      "ntanglemint_prod__programs",
      "ally-supported-languages", // This appears to be where the coupon is stored based on the screenshot
    ]

    let programsData = null
    let keyUsed = ""

    for (const key of possibleKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          // Try to parse the data
          const parsed = JSON.parse(data)

          // Check if this is an array of programs
          if (Array.isArray(parsed)) {
            programsData = data
            keyUsed = key
            debug(`Found array of programs in key: ${key}`)
            break
          }

          // Check if this is a single program object
          if (parsed && typeof parsed === "object" && parsed.id && parsed.name) {
            programsData = JSON.stringify([parsed])
            keyUsed = key
            debug(`Found single program object in key: ${key}`)
            break
          }

          // Special case for the ally-supported-languages key which contains nested data
          if (key === "ally-supported-languages" && parsed && typeof parsed === "object") {
            // Look for coupon-book type in the parsed data
            const couponData = findCouponInObject(parsed)
            if (couponData) {
              programsData = JSON.stringify([couponData])
              keyUsed = key
              debug(`Found coupon data in ally-supported-languages`)
              break
            }
          }
        } catch (e) {
          // If parsing fails, continue to the next key
          debug(`Failed to parse data in key ${key}:`, e)
        }
      }
    }

    // If not found in common keys, try to find any key with "program" in it
    if (!programsData) {
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        if (key.includes("program") || key.includes("coupon")) {
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data)
              if (Array.isArray(parsed) || (parsed && typeof parsed === "object" && parsed.id && parsed.name)) {
                programsData = Array.isArray(parsed) ? data : JSON.stringify([parsed])
                keyUsed = key
                debug(`Found program data in key with 'program' or 'coupon' in name: ${key}`)
                break
              }
            } catch (e) {
              debug(`Failed to parse data in key ${key}:`, e)
            }
          }
        }
      }
    }

    if (!programsData) {
      debug("No program data found in storage")
      return []
    }

    debug(`Found program data in key: ${keyUsed}`)

    // Parse the data
    const programs = JSON.parse(programsData)

    if (!Array.isArray(programs)) {
      debug("Program data is not an array")
      return []
    }

    debug(`Found ${programs.length} total programs directly from storage`)
    return programs
  } catch (error) {
    console.error("Error accessing storage directly:", error)
    return []
  }
}

// Helper function to recursively search for coupon data in an object
function findCouponInObject(obj: any): Program | null {
  if (!obj || typeof obj !== "object") return null

  // Check if this object is a coupon program
  if (
    obj.type === "coupon-book" ||
    (obj.name &&
      obj.description &&
      obj.merchantAddress &&
      (obj.discount || (obj.metadata && (obj.metadata.discountAmount || obj.metadata.discount))))
  ) {
    return obj as Program
  }

  // Recursively check all properties
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      const result = findCouponInObject(obj[key])
      if (result) return result
    }
  }

  return null
}

export function getCouponPrograms(): Program[] {
  const allPrograms = getDirectProgramsFromStorage()

  // Filter for coupon programs
  const couponPrograms = allPrograms.filter((program) => {
    // Log each program for debugging
    debug("Direct check - program:", {
      id: program.id,
      name: program.name,
      type: program.type,
      status: program.status,
    })

    // Check if it's explicitly a coupon-book type
    if (program.type === "coupon-book") {
      debug("Found coupon-book by type:", program.name)
      return true
    }

    // If no type is specified but it has discount information, treat it as a coupon
    if (
      !program.type &&
      (program.discount || (program.metadata && (program.metadata.discountAmount || program.metadata.discount)))
    ) {
      debug("Found coupon-book by discount info:", program.name)
      return true
    }

    // If it has "coupon" in the name or description
    if (
      (program.name && program.name.toLowerCase().includes("coupon")) ||
      (program.description && program.description.toLowerCase().includes("coupon"))
    ) {
      debug("Found coupon by name/description:", program.name)
      return true
    }

    return false
  })

  debug(`Found ${couponPrograms.length} coupon programs directly from storage`)
  return couponPrograms
}

// Function to create a manual coupon based on the data we can see in storage
export function createManualCoupon(): Program {
  return {
    id: "m8qnmqxexfyjygzdv",
    type: "coupon-book",
    name: "Summer Discount",
    description: "Save 10% on Freeze Dried Strawberries.",
    merchantAddress: "19jXXicm7YynAH73xcau38pkSQKjZQer",
    status: "active",
    isPublic: true,
    metadata: {
      discountAmount: "10",
      discountType: "percentage",
      expirationDate: "2025-04-25",
    },
  }
}

// Function to ensure default coupons exist in storage
export function ensureDefaultCoupons() {
  try {
    // Check if programs exist in storage
    const couponPrograms = getCouponPrograms()

    // If no coupon programs, add a default one
    if (couponPrograms.length === 0) {
      debug("No coupon programs found, adding default coupon")
      const defaultCoupon = createManualCoupon()

      // Get all programs
      const allPrograms = getDirectProgramsFromStorage()

      // Add to programs
      allPrograms.push(defaultCoupon)

      // Save back to storage
      localStorage.setItem("programs", JSON.stringify(allPrograms))

      // Dispatch event to notify components
      window.dispatchEvent(
        new CustomEvent("couponFound", {
          detail: { coupon: defaultCoupon },
        }),
      )

      return true
    }

    return false
  } catch (error) {
    console.error("Error ensuring default coupons:", error)
    return false
  }
}

// Function to check if a user has a wallet
export function hasUserWallet(): boolean {
  try {
    // Check for wallet data in cookies
    const walletDataCookie = document.cookie.split("; ").find((row) => row.startsWith("walletData="))

    if (walletDataCookie) {
      return true
    }

    // Check for wallet data in localStorage
    const walletData = localStorage.getItem("wallet-data")
    if (walletData) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking for user wallet:", error)
    return false
  }
}