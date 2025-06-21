import { debug } from "@/lib/debug"

// Fix the type definition for merchantNameCache to ensure it only contains string values
const merchantNameCache: Record<string, string> = {}

// Update the getMerchantName function to handle potential undefined values
export async function getMerchantName(merchantAddress: string, defaultName = "Unknown Merchant"): Promise<string> {
  try {
    // Check cache first
    const cachedName = merchantNameCache[merchantAddress]
    if (cachedName) {
      return cachedName
    }

    // Check if we have merchant profiles in localStorage
    const merchantProfilesStr = localStorage.getItem("merchant-profiles")
    if (merchantProfilesStr) {
      const merchantProfiles = JSON.parse(merchantProfilesStr)

      // Find the merchant profile with matching address
      const merchantProfile = merchantProfiles.find((profile: any) => profile.publicAddress === merchantAddress)

      if (merchantProfile && merchantProfile.businessName) {
        // Cache the result
        merchantNameCache[merchantAddress] = merchantProfile.businessName
        return merchantProfile.businessName
      }
    }

    // If we can't find the merchant in profiles, check programs
    const programsStr = localStorage.getItem("programs")
    if (programsStr) {
      const programs = JSON.parse(programsStr)

      // Find a program created by this merchant that has a name
      const merchantProgram = programs.find(
        (program: any) =>
          program.merchantAddress === merchantAddress && (program.merchantName || program.metadata?.merchantName),
      )

      if (merchantProgram) {
        const name = merchantProgram.merchantName || merchantProgram.metadata?.merchantName
        if (name) {
          // Cache the result
          merchantNameCache[merchantAddress] = name
          return name
        }
      }
    }

    // If we still don't have a name, use the default merchant name
    return defaultName
  } catch (error) {
    debug("Error getting merchant name:", error)
    return defaultName
  }
}

/**
 * Gets all merchants from storage
 * @returns Array of merchant profiles
 */
export function getMerchants(): any[] {
  try {
    const merchantProfilesStr = localStorage.getItem("merchant-profiles")
    if (merchantProfilesStr) {
      return JSON.parse(merchantProfilesStr)
    }
    return []
  } catch (error) {
    debug("Error getting merchants:", error)
    return []
  }
}

/**
 * Gets featured merchants (currently returns all merchants)
 * @param limit Optional limit on number of merchants to return
 * @returns Array of merchant profiles
 */
export function getFeaturedMerchants(limit = 10): any[] {
  const merchants = getMerchants()

  // Sort by program count or other criteria if needed
  const sortedMerchants = merchants.sort((_a, _b) => {
    // Sort logic here - for now just return all
    return 0
  })

  return sortedMerchants.slice(0, limit)
}

/**
 * Gets a merchant by address
 * @param address The merchant's wallet address
 * @returns The merchant profile or null if not found
 */
export function getMerchantByAddress(address: string): any | null {
  const merchants = getMerchants()
  return merchants.find((merchant) => merchant.publicAddress === address) || null
}

/**
 * Gets a merchant profile by address
 * @param merchantAddress The merchant's wallet address
 * @returns The merchant profile or a default profile
 */
export function getMerchantProfile(merchantAddress: string): any {
  try {
    const merchants = getMerchants()
    const merchant = merchants.find((m) => m.publicAddress === merchantAddress)

    if (merchant) {
      return merchant
    }

    // Return a default profile if not found
    return {
      publicAddress: merchantAddress,
      businessName: "Local Business",
      description: "A local business on the platform",
      categories: ["Retail"],
    }
  } catch (error) {
    debug("Error getting merchant profile:", error)
    return {
      publicAddress: merchantAddress,
      businessName: "Local Business",
      description: "A local business on the platform",
      categories: ["Retail"],
    }
  }
}