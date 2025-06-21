import { debug } from "@/lib/debug"
import type { Program } from "@/types"

// Default UPC code for Freeze Dried Strawberries
const STRAWBERRY_UPC = "706970457638"

/**
 * Create default merchant programs for a specific merchant address
 * @param merchantAddress The merchant's wallet address
 * @returns Array of created programs
 */
export function createDefaultMerchantPrograms(merchantAddress: string): Program[] {
  debug(`Creating default merchant programs for address: ${merchantAddress}`)

  const createdPrograms: Program[] = []

  // Create Coffee Loyalty Card program
  const coffeeProgram: Program = {
    id: `coffee-${Date.now()}`,
    name: "Coffee Loyalty Card",
    description: "Buy 5 coffees, get 1 free!",
    type: "punch-card",
    merchantAddress: merchantAddress,
    status: "active",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [],
    metadata: {
      requiredPunches: 5,
      reward: "Free coffee",
      expirationDate: "2025-12-31",
      products: [
        {
          id: `prod_${Date.now()}_1`,
          name: "Regular Coffee",
          description: "Our signature house blend coffee",
          price: "3.99",
          imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80",
          createdAt: new Date().toISOString(),
        },
        {
          id: `prod_${Date.now()}_2`,
          name: "Cappuccino",
          description: "Espresso with steamed milk and foam",
          price: "4.99",
          imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
          createdAt: new Date().toISOString(),
        },
      ],
    },
  }

  createdPrograms.push(coffeeProgram)

  // Create Summer Discount program
  const summerDiscount: Program = {
    id: `discount-${Date.now()}`,
    type: "coupon-book",
    name: "Summer Discount",
    description: "Save 10% on Freeze Dried Strawberries.",
    merchantAddress: merchantAddress,
    status: "active",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [],
    metadata: {
      discountAmount: "10",
      discountType: "percentage",
      expirationDate: "2025-04-25",
      merchantName: "Local Grocery",
      upcCodes: [STRAWBERRY_UPC],
      products: [
        {
          id: `prod_${Date.now()}`,
          name: "Freeze Dried Strawberry Slices",
          description:
            "Sweet and crunchy freeze-dried strawberry slices from Valley Food Storage. Perfect for snacking!",
          price: "12.99",
          upc: STRAWBERRY_UPC,
          imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80",
          createdAt: new Date().toISOString(),
          manufacturer: "Valley Food Storage",
        },
      ],
    },
  }

  createdPrograms.push(summerDiscount)

  debug(`Created ${createdPrograms.length} default programs for merchant ${merchantAddress}`)
  return createdPrograms
}

/**
 * Create a program for a specific merchant
 * @param merchantAddress The merchant's wallet address
 * @param programType The type of program to create
 * @param programName Optional custom name for the program
 * @returns The created program
 */
export function createProgramForMerchant(
  merchantAddress: string,
  programType: "punch-card" | "coupon-book" | "points",
  programName?: string,
): Program {
  debug(`Creating ${programType} program for merchant ${merchantAddress}`)

  // Generate a unique ID
  const programId = `${programType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Create base program
  const program: Program = {
    id: programId,
    name: programName || getDefaultProgramName(programType),
    description: getDefaultProgramDescription(programType),
    type: programType,
    merchantAddress: merchantAddress,
    status: "active",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [],
    metadata: {},
  }

  // Add type-specific metadata
  if (programType === "punch-card") {
    program.metadata = {
      requiredPunches: 5,
      reward: "Free item",
      expirationDate: getDefaultExpirationDate(programType),
    }
  } else if (programType === "coupon-book") {
    program.metadata = {
      discountAmount: "10",
      discountType: "percentage",
      expirationDate: getDefaultExpirationDate(programType),
    }
  } else if (programType === "points") {
    program.metadata = {
      pointsPerDollar: 10,
      minimumPurchase: 0,
      redemptionRatio: 100, // 100 points = $1
      expirationDate: getDefaultExpirationDate(programType),
    }
  }

  debug(`Created ${programType} program with ID ${programId}`)
  return program
}

// Helper functions
function getDefaultProgramName(programType: string): string {
  switch (programType) {
    case "punch-card":
      return "Loyalty Card"
    case "coupon-book":
      return "Discount Coupon"
    case "points":
      return "Points Rewards"
    default:
      return "Loyalty Program"
  }
}

function getDefaultProgramDescription(programType: string): string {
  switch (programType) {
    case "punch-card":
      return "Buy 5, get 1 free!"
    case "coupon-book":
      return "Save 10% on your purchase"
    case "points":
      return "Earn points with every purchase"
    default:
      return "Reward your loyal customers"
  }
}

function getDefaultExpirationDate(programType: string): string {
  const date = new Date()

  // Set expiration based on program type
  switch (programType) {
    case "punch-card":
      // Punch cards expire in 1 year
      date.setFullYear(date.getFullYear() + 1)
      break
    case "coupon-book":
      // Coupons expire in 3 months
      date.setMonth(date.getMonth() + 3)
      break
    case "points":
      // Points expire in 2 years
      date.setFullYear(date.getFullYear() + 2)
      break
    default:
      // Default expiration is 1 year
      date.setFullYear(date.getFullYear() + 1)
  }

  // Format as YYYY-MM-DD
  const isoString = date.toISOString()
  const parts = isoString.split("T")

  // Ensure we always return a valid string, even if split fails
  return parts[0] || isoString.substring(0, 10)
}

export default {
  createDefaultMerchantPrograms,
  createProgramForMerchant,
}