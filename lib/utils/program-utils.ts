/**
 * Program utilities
 * Comprehensive utilities for program creation, fixing, and management
 * Combined functionality from program-utils.ts and direct-program-fixes.ts
 */
import { debug } from "@/lib/debug"
import { getWalletData } from "@/lib/storage-compat"
import { fixStorageJson } from "@/lib/storage-fix"
import { storageService } from "@/lib/storage-service-compat"
import { saveProgram } from "@/lib/programs"
import type { Program } from "@/types"

// Define a Product interface for type safety (ADDED from direct-program-fixes)
interface Product {
  id?: string
  name: string
  description?: string
  price?: string
  imageUrl?: string
  upc?: string
  manufacturer?: string
  createdAt?: string
  [key: string]: any // Allow for additional properties
}

// Configuration for default products
const DEFAULT_COFFEE_PRODUCTS: Product[] = [
  {
    name: "Regular Coffee",
    description: "Our signature house blend coffee",
    price: "3.99",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Cappuccino",
    description: "Espresso with steamed milk and foam",
    price: "4.99",
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
  },
]

const DEFAULT_GROCERY_PRODUCTS: Product[] = [
  {
    name: "Freeze Dried Strawberry Slices",
    description: "Sweet and crunchy freeze-dried strawberry slices from Valley Food Storage. Perfect for snacking!",
    price: "12.99",
    upc: "706970457638",
    imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80",
    manufacturer: "Valley Food Storage",
  },
]

// Helper function to generate a unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ADDED: Helper function to format a date for display (from direct-program-fixes)
export function formatDisplayDate(dateString?: string): string {
  if (!dateString) return "No date set"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return "Invalid date format"
  }
}

/**
 * Fix all program data issues
 * Enhanced with better error handling from direct-program-fixes
 * @returns Boolean indicating success
 */
export function fixAllProgramData(): boolean {
  try {
    debug("Fixing all program data...")

    // Get all programs
    const programs = storageService.getPrograms()
    if (!programs || !Array.isArray(programs)) {
      debug("No programs found to fix")
      return false
    }

    debug(`Fixing ${programs.length} programs...`)

    // Fix each program
    programs.forEach((program) => {
      // Ensure participants is an array
      if (!program.participants) {
        program.participants = []
      }

      // Ensure metadata exists
      if (!program.metadata) {
        program.metadata = {}
      }

      // Set program type based on name if not set
      if (!program.type) {
        if (program.name?.toLowerCase().includes("coffee") || program.name?.toLowerCase().includes("punch")) {
          program.type = "punch-card"
        } else if (program.name?.toLowerCase().includes("discount")) {
          program.type = "coupon-book"
        } else {
          program.type = "points" // Using "points" as a fallback type
        }
      }

      // Set expiration date if not set
      if (!program.expirationDate) {
        if (program.name === "Coffee Loyalty Card") {
          program.expirationDate = "2025-12-31T23:59:59.999Z"
        } else if (program.name === "Summer Discount") {
          program.expirationDate = "2025-04-25T23:59:59.999Z"
        } else {
          // Default expiration is 1 year from now
          const oneYearFromNow = new Date()
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
          program.expirationDate = oneYearFromNow.toISOString()
        }
      }

      // Set metadata.requiredPunches for punch cards
      if (program.type === "punch-card" && !program.metadata.requiredPunches) {
        program.metadata.requiredPunches = 5
      }

      // Set metadata.reward for punch cards
      if (program.type === "punch-card" && !program.metadata.reward) {
        program.metadata.reward = "Free coffee"
      }
    })

    // Save the updated programs
    storageService.savePrograms(programs)

    // Ensure all programs have products
    ensureAllProgramsHaveProducts()

    debug("Program data fixed successfully")
    return true
  } catch (error) {
    console.error("Error fixing program data:", error)
    return false
  }
}

/**
 * Fix expiration dates for all programs
 * Enhanced with better error handling and date formatting
 * @returns Boolean indicating success
 */
export function directFixExpirationDates(): boolean {
  try {
    // Get all programs
    const programs = storageService.getPrograms()
    if (!programs || !Array.isArray(programs)) {
      debug("No programs found to fix expiration dates")
      return false
    }

    debug(`Fixing expiration dates for ${programs.length} programs...`)

    // Fix each program
    programs.forEach((program) => {
      // Set expiration date if not set
      if (!program.expirationDate) {
        if (program.name === "Coffee Loyalty Card") {
          program.expirationDate = "2025-12-31T23:59:59.999Z"
        } else if (program.name === "Summer Discount") {
          program.expirationDate = "2025-04-25T23:59:59.999Z"
        } else {
          // Default expiration is 1 year from now
          const oneYearFromNow = new Date()
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
          program.expirationDate = oneYearFromNow.toISOString()
        }
      } else if (program.name === "Coffee Loyalty Card") {
        // Fix inconsistent date in all possible formats
        if (
          program.expirationDate &&
          (program.expirationDate.includes("2025-12-30") ||
            program.expirationDate.includes("12/30/2025") ||
            program.expirationDate.includes("30/12/2025") ||
            program.expirationDate === "12/30/25")
        ) {
          program.expirationDate = "2025-12-31T23:59:59.999Z"
          debug("Fixed Coffee Loyalty Card expirationDate")
        }

        // Also check and fix metadata expiration date
        if (program.metadata && program.metadata.expirationDate) {
          if (
            program.metadata.expirationDate.includes("2025-12-30") ||
            program.metadata.expirationDate.includes("12/30/2025") ||
            program.metadata.expirationDate.includes("30/12/2025") ||
            program.metadata.expirationDate === "12/30/25"
          ) {
            program.metadata.expirationDate = "2025-12-31"
            debug("Fixed Coffee Loyalty Card metadata.expirationDate")
          }
        }
      }

      // Format the date for display (ADDED from direct-program-fixes)
      const formattedDate = formatDisplayDate(program.expirationDate)
      debug(`Program ${program.name} expiration date: ${formattedDate}`)
    })

    // Save the updated programs
    storageService.savePrograms(programs)

    debug("Expiration dates fixed successfully")
    return true
  } catch (error) {
    console.error("Error fixing expiration dates:", error)
    return false
  }
}

/**
 * Ensure all programs have products
 * Enhanced with better type safety and error handling
 * @returns Boolean indicating success
 */
export function ensureAllProgramsHaveProducts(): boolean {
  try {
    // Get all programs
    const programs = storageService.getPrograms()
    if (!programs || !Array.isArray(programs)) {
      debug("No programs found to ensure products")
      return false
    }

    debug(`Ensuring products for ${programs.length} programs...`)

    // Fix each program
    programs.forEach((program) => {
      // Ensure metadata exists
      if (!program.metadata) {
        program.metadata = {}
      }

      // Ensure products array exists
      if (!program.metadata.products || !Array.isArray(program.metadata.products)) {
        program.metadata.products = []
      }

      // If no products, add default ones based on program type
      if (program.metadata.products.length === 0) {
        if (program.name === "Coffee Loyalty Card" || program.type === "punch-card") {
          // Add default coffee products with proper typing
          program.metadata.products = DEFAULT_COFFEE_PRODUCTS.map((product: Product) => ({
            ...product,
            id: `prod_${generateId()}`,
            createdAt: new Date().toISOString(),
          }))
          debug(`Added default coffee products to ${program.name}`)
        } else if (program.name === "Summer Discount" || program.type === "coupon-book") {
          program.metadata.products = DEFAULT_GROCERY_PRODUCTS.map((product: Product) => ({
            ...product,
            id: `prod_${generateId()}`,
            createdAt: new Date().toISOString(),
          }))
          debug(`Added default grocery products to ${program.name}`)
        }
      }
    })

    // Save the updated programs
    storageService.savePrograms(programs)

    debug("Products added to programs successfully")
    return true
  } catch (error) {
    console.error("Error ensuring products for programs:", error)
    return false
  }
}

/**
 * Fix program card display issues
 * Enhanced with better error handling and consistency checks
 * @returns Boolean indicating success
 */
export function fixProgramCardDisplay(): boolean {
  try {
    // Get all programs
    const programs = storageService.getPrograms()
    if (!programs || !Array.isArray(programs)) {
      debug("No programs found to fix card display")
      return false
    }

    let updatedCount = 0

    // Process each program
    programs.forEach((program) => {
      let updated = false

      // Normalize status to lowercase for consistency in storage
      if (program.status && typeof program.status === "string") {
        const normalizedStatus = program.status.toLowerCase()

        // If the status is different after normalization, update it
        if (program.status !== normalizedStatus) {
          program.status = normalizedStatus as any
          updated = true
          debug(`Normalized status for program ${program.id}: ${program.status}`)
        }
      }

      // If program has "Copy of" in the name, ensure it's set to draft
      if (program.name && program.name.startsWith("Copy of") && program.status !== "draft") {
        program.status = "draft" as any
        updated = true
        debug(`Set copied program ${program.id} status to draft`)
      }

      // Ensure expirationDate is consistent between metadata and root
      if (program.metadata?.expirationDate && program.expirationDate) {
        // Get the date part from the ISO string
        const rootDatePart = program.expirationDate.split("T")[0]
        const metadataDate = program.metadata.expirationDate

        // If they're different, update to be consistent
        if (rootDatePart !== metadataDate) {
          // Use metadata date as the source of truth
          const fixedDate = `${metadataDate}T12:00:00.000Z`
          program.expirationDate = fixedDate
          updated = true
          debug(`Fixed inconsistent dates for program ${program.id}: metadata=${metadataDate}, root=${rootDatePart}`)
        }
      }

      // Ensure program has a description
      if (!program.description) {
        program.description = program.name
          ? `${program.name} - A loyalty program for customers`
          : "A loyalty program for customers"
        updated = true
      }

      // Ensure program has isPublic property
      if (program.isPublic === undefined) {
        program.isPublic = true
        updated = true
      }

      if (updated) {
        updatedCount++
      }
    })

    // Save the updated programs if any were changed
    if (updatedCount > 0) {
      storageService.savePrograms(programs)
      debug(`Fixed display issues for ${updatedCount} programs`)
    }

    return updatedCount > 0
  } catch (error) {
    console.error("Error fixing program card display:", error)
    return false
  }
}

// Default UPC code for Freeze Dried Strawberries
const STRAWBERRY_UPC = "706970457638"

/**
 * Load programs from storage with fallback mechanisms
 * This function tries multiple approaches to find programs
 */
export function loadPrograms() {
  try {
    // Get regular programs
    const programs = storageService.getPrograms() || []

    // Get coupon programs
    const couponPrograms = storageService.getCouponPrograms() || []

    // Combine programs, avoiding duplicates
    const allPrograms = [...programs]

    couponPrograms.forEach((coupon) => {
      const exists = allPrograms.some((p) => p.id === coupon.id)
      if (!exists) {
        // Ensure coupon has the right type for filtering
        if (!coupon.type) {
          coupon.type = "coupon-book"
        }
        allPrograms.push(coupon)
      }
    })

    return allPrograms
  } catch (error) {
    console.error("Error loading programs:", error)
    return []
  }
}

/**
 * Create default programs for display when none are found
 */
export function createDefaultProgramsData(): Program[] {
  debug("Creating default programs")

  return [
    {
      id: "coffee-loyalty",
      name: "Coffee Loyalty Card",
      description: "Buy 5 coffees, get 1 free!",
      type: "punch-card",
      status: "active",
      merchantAddress: "19jXXicm7YynAH73xcau38pkSQKjZQer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      participants: [],
      metadata: {
        requiredPunches: 5,
        reward: "Free coffee",
        expirationDate: "2025-12-31",
      },
    },
    {
      id: "summer-discount",
      name: "Summer Discount",
      description: "Save 10% on Freeze Dried Strawberries",
      type: "coupon-book",
      status: "active",
      merchantAddress: "19jXXicm7YynAH73xcau38pkSQKjZQer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      participants: [],
      metadata: {
        discountAmount: "10",
        discountType: "percentage",
        expirationDate: "2025-04-25",
      },
    },
  ]
}

/**
 * Save programs to storage
 */
export function savePrograms(programs: Program[]): boolean {
  try {
    if (!Array.isArray(programs)) {
      debug("Cannot save programs: not an array")
      return false
    }

    // Save to localStorage
    localStorage.setItem("programs", JSON.stringify(programs))
    debug(`Saved ${programs.length} programs to localStorage`)

    // Also save individual programs
    programs.forEach((program) => {
      if (program && program.id) {
        localStorage.setItem(`program:${program.id}`, JSON.stringify(program))
      }
    })

    return true
  } catch (error) {
    console.error("Error saving programs:", error)
    return false
  }
}

// Get all programs from storage
export async function getPrograms() {
  try {
    // Try to get programs from localStorage
    const programsStr = localStorage.getItem("programs")
    if (programsStr) {
      const programs = JSON.parse(programsStr)
      if (Array.isArray(programs) && programs.length > 0) {
        return programs
      }
    }

    // If no programs found, return default programs
    return [
      {
        id: "summer-discount",
        name: "Summer Discount",
        description: "Save 10% on Freeze Dried Strawberries.",
        type: "coupon-book",
        status: "active",
        merchantAddress: "merchant1",
        merchantName: "#1 Summa",
        discount: "10% off",
        expirationDate: "2025-04-25T23:59:59.999Z",
        participants: ["user1"],
        metadata: {
          discountAmount: 10,
          discountType: "percentage",
          expirationDate: "2025-04-25T23:59:59.999Z",
        },
      },
      {
        id: "coffee-loyalty",
        name: "Coffee Loyalty Card",
        description: "Buy 5 coffees, get 1 free!",
        type: "punch-card",
        status: "active",
        merchantAddress: "merchant1",
        merchantName: "#1 Summa",
        expirationDate: "2025-12-31T23:59:59.999Z",
        participants: [],
        metadata: {
          requiredPunches: 5,
          reward: "Free coffee",
          expirationDate: "2025-12-31T23:59:59.999Z",
        },
      },
    ]
  } catch (error) {
    debug("Error getting programs:", error)
    // Return default programs on error
    return [
      {
        id: "summer-discount",
        name: "Summer Discount",
        description: "Save 10% on Freeze Dried Strawberries.",
        type: "coupon-book",
        status: "active",
        merchantAddress: "merchant1",
        merchantName: "#1 Summa",
        discount: "10% off",
        expirationDate: "2025-04-25T23:59:59.999Z",
        participants: ["user1"],
        metadata: {
          discountAmount: 10,
          discountType: "percentage",
          expirationDate: "2025-04-25T23:59:59.999Z",
        },
      },
      {
        id: "coffee-loyalty",
        name: "Coffee Loyalty Card",
        description: "Buy 5 coffees, get 1 free!",
        type: "punch-card",
        status: "active",
        merchantAddress: "merchant1",
        merchantName: "#1 Summa",
        expirationDate: "2025-12-31T23:59:59.999Z",
        participants: [],
        metadata: {
          requiredPunches: 5,
          reward: "Free coffee",
          expirationDate: "2025-12-31T23:59:59.999Z",
        },
      },
    ]
  }
}

// Get program by ID
export async function getProgramById(id: string) {
  try {
    const programs = await getPrograms()
    return programs.find((p) => p.id === id) || null
  } catch (error) {
    debug("Error getting program by ID:", error)
    return null
  }
}

// Join a program
export async function joinProgram(programId: string, userAddress: string) {
  try {
    // Get all programs
    const programsStr = localStorage.getItem("programs") || "[]"
    const programs = JSON.parse(programsStr)

    // Find the program to join
    const programIndex = programs.findIndex((p: any) => p.id === programId)
    if (programIndex === -1) {
      throw new Error(`Program with ID ${programId} not found`)
    }

    // Add user to participants if not already there
    const program = programs[programIndex]
    if (!Array.isArray(program.participants)) {
      program.participants = []
    }

    if (!program.participants.includes(userAddress)) {
      program.participants.push(userAddress)

      // Update program in storage
      programs[programIndex] = program
      localStorage.setItem("programs", JSON.stringify(programs))

      // For punch cards, initialize user's punches
      if (program.type === "punch-card") {
        const userPunchesKey = `user-punches-${userAddress}`
        const userPunchesStr = localStorage.getItem(userPunchesKey) || "{}"
        const userPunches = JSON.parse(userPunchesStr)

        if (!userPunches[programId]) {
          userPunches[programId] = {
            count: 0,
            lastUpdated: new Date().toISOString(),
          }
          localStorage.setItem(userPunchesKey, JSON.stringify(userPunches))
        }
      }

      return { success: true, message: `Successfully joined ${program.name}` }
    }

    return { success: true, message: `Already joined ${program.name}` }
  } catch (error) {
    debug("Error joining program:", error)
    return { success: false, message: `Failed to join program: ${error}` }
  }
}

// Fix participant counts for all programs
export function fixParticipantCounts() {
  try {
    const programsStr = localStorage.getItem("programs")
    if (!programsStr) return { fixed: 0, total: 0 }

    const programs = JSON.parse(programsStr)
    if (!Array.isArray(programs)) return { fixed: 0, total: 0 }

    let fixedCount = 0

    for (let i = 0; i < programs.length; i++) {
      const program = programs[i]

      // Ensure participants is an array
      if (!Array.isArray(program.participants)) {
        program.participants = []
        fixedCount++
      }

      // Add stats object if it doesn't exist
      if (!program.stats) {
        program.stats = {}
      }

      // Update participant count in stats
      program.stats.participantCount = program.participants.length
    }

    // Save updated programs
    if (fixedCount > 0) {
      localStorage.setItem("programs", JSON.stringify(programs))
    }

    return { fixed: fixedCount, total: programs.length }
  } catch (error) {
    debug("Error fixing participant counts:", error)
    return { fixed: 0, total: 0, error: String(error) }
  }
}

/**
 * Create the Coffee Loyalty Card program
 */
export function createCoffeeLoyaltyProgram(): boolean {
  try {
    debug("Creating Coffee Loyalty Card program")

    // Get wallet data
    const walletData = getWalletData()
    if (!walletData || !walletData.publicAddress) {
      debug("No wallet data found, cannot create program")
      return false
    }

    // Check if programs exist in localStorage
    fixStorageJson("programs")
    const programsStr = localStorage.getItem("programs")
    let programs = []

    if (programsStr) {
      try {
        programs = JSON.parse(programsStr)
      } catch (e) {
        debug("Error parsing programs, initializing empty array")
        programs = []
      }
    }

    // Check if Coffee Loyalty Card already exists
    const existingProgram = programs.find(
      (p: any) => p.name === "Coffee Loyalty Card" || (p.type === "punch-card" && p.metadata?.requiredPunches),
    )

    if (existingProgram) {
      debug("Coffee Loyalty Card program already exists")
      return false
    }

    // Create Coffee Loyalty Card program
    const coffeeProgram = {
      id: `coffee-${Date.now()}`,
      name: "Coffee Loyalty Card",
      description: "Buy 5 coffees, get 1 free!",
      type: "punch-card",
      merchantAddress: walletData.publicAddress,
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

    // Add to programs
    programs.push(coffeeProgram)

    // Save back to localStorage
    localStorage.setItem("programs", JSON.stringify(programs))
    debug("Coffee Loyalty Card program created successfully")

    return true
  } catch (error) {
    console.error("Error creating Coffee Loyalty Card program:", error)
    return false
  }
}

/**
 * Create the Summer Discount program
 */
export function createSummerDiscountProgram(): boolean {
  try {
    debug("Creating Summer Discount program")

    // Get wallet data
    const walletData = getWalletData()
    if (!walletData || !walletData.publicAddress) {
      debug("No wallet data found, cannot create program")
      return false
    }

    // Check if programs exist in localStorage
    fixStorageJson("programs")
    const programsStr = localStorage.getItem("programs")
    let programs = []

    if (programsStr) {
      try {
        programs = JSON.parse(programsStr)
      } catch (e) {
        debug("Error parsing programs, initializing empty array")
        programs = []
      }
    }

    // Check if Summer Discount already exists
    const existingProgram = programs.find(
      (p: any) => p.name === "Summer Discount" || p.id === "summer-discount" || p.id === "m8qnmqxexfyjygzdv",
    )

    if (existingProgram) {
      debug("Summer Discount program already exists")

      // Update the ID to be consistent if needed
      if (existingProgram.id !== "summer-discount") {
        existingProgram.id = "summer-discount"
        // Save the updated program
        localStorage.setItem("programs", JSON.stringify(programs))
        debug("Updated Summer Discount program ID to be consistent")
      }

      return false
    }

    // Create Summer Discount program
    const summerDiscount = {
      id: "summer-discount", // Use consistent ID that matches the URL
      type: "coupon-book",
      name: "Summer Discount",
      description: "Save 10% on Freeze Dried Strawberries.",
      merchantAddress: walletData.publicAddress,
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

    // Add to programs
    programs.push(summerDiscount)

    // Save back to localStorage
    localStorage.setItem("programs", JSON.stringify(programs))
    debug("Summer Discount program created successfully")

    return true
  } catch (error) {
    console.error("Error creating Summer Discount program:", error)
    return false
  }
}

/**
 * Create all default programs
 */
export function createDefaultPrograms(): boolean {
  try {
    debug("Creating default programs")

    // Create Coffee Loyalty Card if it doesn't exist
    const coffeeCreated = createCoffeeLoyaltyProgram()

    // Create Summer Discount if it doesn't exist
    const discountCreated = createSummerDiscountProgram()

    return coffeeCreated || discountCreated
  } catch (error) {
    console.error("Error creating default programs:", error)
    return false
  }
}

/**
 * Ensures all programs have proper UPC code structure
 */
export function ensureAllProgramsHaveProperUpcStructure() {
  debug("Ensuring all programs have proper UPC code structure...")

  try {
    // Get all programs
    const programs = storageService.getPrograms()
    let updatedCount = 0

    // Process each program
    programs.forEach((program) => {
      let programUpdated = false

      // Ensure metadata exists
      if (!program.metadata) {
        program.metadata = {}
        programUpdated = true
      }

      // Ensure UPC codes array exists
      if (!program.metadata.upcCodes || !Array.isArray(program.metadata.upcCodes)) {
        program.metadata.upcCodes = []
        programUpdated = true
      }

      // Get products for this program
      const products = storageService.getProductsForProgram(program.id)

      // Ensure products array exists in metadata
      if (!program.metadata.products || !Array.isArray(program.metadata.products)) {
        program.metadata.products = []
        programUpdated = true
      }

      // Add products to metadata if they don't exist
      products.forEach((product) => {
        const existingProduct = program.metadata?.products?.find((p: any) => p.id === product.id)
        if (!existingProduct && program.metadata && program.metadata.products) {
          program.metadata.products.push(product)
          programUpdated = true
        }
      })

      // Add UPC codes from products
      let addedUpcCount = 0
      products.forEach((product) => {
        if (
          product.upc &&
          program.metadata &&
          program.metadata.upcCodes &&
          !program.metadata.upcCodes.includes(product.upc)
        ) {
          program.metadata.upcCodes.push(product.upc)
          addedUpcCount++
          programUpdated = true
        }
      })

      if (addedUpcCount > 0) {
        debug(`Added ${addedUpcCount} UPC codes from products to program ${program.id}`)
      }

      // Save the updated program if changes were made
      if (programUpdated) {
        storageService.saveProgram(program)
        updatedCount++
      }
    })

    debug(`Updated ${updatedCount} programs with proper UPC code structure`)
    return updatedCount > 0
  } catch (error) {
    debug(`Error ensuring proper UPC code structure: ${error}`)
    return false
  }
}

/**
 * Comprehensive program fix that runs all available fixes
 */
export function fixAllPrograms(): boolean {
  try {
    debug("Running comprehensive program fix...")

    // Fix participant counts
    fixParticipantCounts()

    // Fix program card display
    fixProgramCardDisplay()

    // Ensure all programs have proper UPC code structure
    ensureAllProgramsHaveProperUpcStructure()

    // Create default programs if they don't exist
    createDefaultPrograms()

    debug("Comprehensive program fix completed")
    return true
  } catch (error) {
    console.error("Error in comprehensive program fix:", error)
    return false
  }
}

/**
 * Create programs for a specific merchant address
 * This is useful for debugging when programs aren't showing up
 * @param merchantAddress The merchant address to create programs for
 * @returns Array of created programs
 */
export function createProgramsForMerchant(merchantAddress: string): any[] {
  try {
    debug(`Creating default programs for merchant: ${merchantAddress}`)

    // Create coffee loyalty program
    const coffeeLoyaltyProgram = {
      id: `coffee-loyalty-${Date.now()}`,
      type: "punch-card",
      name: "Coffee Loyalty Card",
      description: "Buy 9 coffees, get the 10th free!",
      merchantAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      isPublic: true,
      version: 1,
      participants: [],
      metadata: {
        requiredPunches: 9,
        reward: "Free coffee of your choice",
        expirationDate: "2025-12-31T23:59:59.999Z",
      },
    }

    // Create summer discount program
    const summerDiscountProgram = {
      id: `summer-discount-${Date.now()}`,
      type: "coupon-book",
      name: "Summer Discount",
      description: "10% off on all freeze dried strawberries",
      merchantAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      isPublic: true,
      version: 1,
      participants: [],
      metadata: {
        discountAmount: "10",
        discountType: "percentage",
        expirationDate: "2025-04-25T23:59:59.999Z",
        terms: "Cannot be combined with other offers. Valid on freeze dried strawberries only.",
      },
    }

    // Save programs
    const programs = [coffeeLoyaltyProgram, summerDiscountProgram]
    programs.forEach((program) => saveProgram(program))

    debug(`Created ${programs.length} default programs for merchant`)

    // Dispatch event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("programsUpdated"))
    }

    return programs
  } catch (error) {
    console.error("Error creating default programs:", error)
    return []
  }
}

/**
 * Fix all program data
 */
export function fixAllProgramDataV2(): void {
  try {
    debug("Fixing all program data")

    // This function would scan and fix any corrupted program data
    // For now, it's just a placeholder

    debug("Program data fix completed")
  } catch (error) {
    console.error("Error fixing program data:", error)
  }
}

/**
 * Check if a wallet is the owner of a program
 * @param walletAddress The wallet address to check
 * @param program The program to check ownership for
 * @returns Boolean indicating if the wallet is the program owner
 */
export function isProgramOwner(walletAddress: string | undefined, program: any): boolean {
  if (!walletAddress || !program || !program.merchantAddress) {
    return false
  }

  // Direct string comparison of addresses
  return walletAddress === program.merchantAddress
}

/**
 * Check if a wallet is a merchant wallet
 * @param walletType The wallet type to check
 * @returns Boolean indicating if the wallet is a merchant wallet
 */
export function isMerchantWallet(walletType: string | undefined): boolean {
  return walletType === "merchant"
}

export default {
  getPrograms,
  getProgramById,
  joinProgram,
  fixParticipantCounts,
  createCoffeeLoyaltyProgram,
  createSummerDiscountProgram,
  ensureAllProgramsHaveProperUpcStructure,
  fixProgramCardDisplay,
  fixAllPrograms,
  fixAllProgramData,
  directFixExpirationDates,
  ensureAllProgramsHaveProducts,
  loadPrograms,
  savePrograms,
  isProgramOwner,
  isMerchantWallet,
  formatDisplayDate, // ADDED from direct-program-fixes
}