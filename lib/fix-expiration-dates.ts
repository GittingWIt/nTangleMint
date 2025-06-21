/**
 * Utility to fix expiration dates in programs
 */

// Force set expiration dates for specific programs
export function fixExpirationDates(): boolean {
    if (typeof window === "undefined") return false
  
    try {
      // Get all programs from localStorage
      const programsKey = "programs"
      const programsJson = localStorage.getItem(programsKey)
      if (!programsJson) return false
  
      const programs = JSON.parse(programsJson)
      let updated = false
  
      // Update programs with correct expiration dates
      const updatedPrograms = programs.map((program: any) => {
        // Check if program needs expiration date fix
        if (program.name === "Coffee Loyalty Card") {
          program.expirationDate = "2025-12-31T23:59:59.999Z"
          updated = true
        } else if (program.name === "Summer Discount") {
          program.expirationDate = "2025-04-25T23:59:59.999Z"
          updated = true
        }
  
        return program
      })
  
      // Save updated programs back to localStorage
      if (updated) {
        localStorage.setItem(programsKey, JSON.stringify(updatedPrograms))
        console.log("Fixed expiration dates for programs")
      }
  
      return updated
    } catch (error) {
      console.error("Error fixing expiration dates:", error)
      return false
    }
  }
  
  // Fix expiration dates in punch cards
  export function fixPunchCardExpirationDates(): boolean {
    if (typeof window === "undefined") return false
  
    try {
      // Get all punch cards from localStorage
      const punchCardsKey = "punchCards"
      const punchCardsJson = localStorage.getItem(punchCardsKey)
      if (!punchCardsJson) return false
  
      const punchCards = JSON.parse(punchCardsJson)
      let updated = false
  
      // Update punch cards with correct expiration dates
      const updatedPunchCards = punchCards.map((card: any) => {
        // Check if card needs expiration date fix
        if (card.name === "Coffee Loyalty Card" || card.programName === "Coffee Loyalty Card") {
          card.expirationDate = "2025-12-31T23:59:59.999Z"
          updated = true
        }
  
        return card
      })
  
      // Save updated punch cards back to localStorage
      if (updated) {
        localStorage.setItem(punchCardsKey, JSON.stringify(updatedPunchCards))
        console.log("Fixed expiration dates for punch cards")
      }
  
      return updated
    } catch (error) {
      console.error("Error fixing punch card expiration dates:", error)
      return false
    }
  }  