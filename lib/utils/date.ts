/**
 * Date utilities for consistent date handling across the application
 */

/**
 * Normalizes a date string to a consistent format (YYYY-MM-DD)
 * Handles various input formats and ensures timezone consistency
 */
export function normalizeDate(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    // Handle MM/DD/YYYY format
    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts.length === 3) {
        let year = parts[2] || ""
        // Fix year if > 4 digits
        if (year.length > 4) {
          year = year.substring(0, 4)
        }
        const month = parts[0] ? parts[0].padStart(2, "0") : "01"
        const day = parts[1] ? parts[1].padStart(2, "0") : "01"
        return `${year}-${month}-${day}`
      }
    }

    // Handle ISO date format with time (strip the time part)
    if (dateString.includes("T")) {
      const parts = dateString.split("T")
      return parts[0] || dateString
    }

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // For any other format, parse with Date and format consistently
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }

    let year = date.getUTCFullYear().toString()
    if (year.length > 4) {
      year = year.substring(0, 4)
    }

    return `${year}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`
  } catch (error) {
    console.error("Error normalizing date:", error)
    return dateString
  }
}

/**
 * Converts a date string to ISO format with time for storage
 */
export function toStorageFormat(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    const normalizedDate = normalizeDate(dateString)
    if (!normalizedDate) return ""
    return `${normalizedDate}T23:59:59.999Z`
  } catch (error) {
    console.error("Error converting date to storage format:", error)
    return dateString || ""
  }
}

/**
 * Checks if two date strings represent the same date (ignoring time)
 */
export function areSameDates(date1: string | null | undefined, date2: string | null | undefined): boolean {
  if (!date1 || !date2) return false

  try {
    return normalizeDate(date1) === normalizeDate(date2)
  } catch (error) {
    console.error("Error comparing dates:", error)
    return false
  }
}

/**
 * Formats a date for display (e.g., "April 25, 2025")
 */
export function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return "No date"

  try {
    const normalized = normalizeDate(dateString)
    if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return "Invalid date"
    }

    const parts = normalized.split("-")
    let yearStr = parts[0] ?? ""
    if (yearStr.length > 4) {
      yearStr = yearStr.substring(0, 4)
    }

    const year = Number.parseInt(yearStr, 10)
    const month = Number.parseInt(parts[1] ?? "", 10) - 1
    const day = Number.parseInt(parts[2] ?? "", 10)

    if (isNaN(year) || isNaN(month) || isNaN(day) || year === 0 || month < 0 || day === 0) {
      return "Invalid date"
    }

    const date = new Date(Date.UTC(year, month, day))
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  } catch (error) {
    console.error("Error formatting display date:", error)
    return "Invalid date"
  }
}

/**
 * Formats a date for card display (e.g., "04/25/2025")
 */
export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return "No date"

  try {
    const normalized = normalizeDate(dateString)
    if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return "Invalid date"
    }

    const parts = normalized.split("-")
    let year = parts[0]
    if (year && year.length > 4) {
      year = year.substring(0, 4)
    }

    return `${parts[1]}/${parts[2]}/${year}`
  } catch (error) {
    console.error("Error formatting card date:", error)
    return "Invalid date"
  }
}

/**
 * Calculates the number of remaining days between a given date and today
 */
export function getRemainingDays(dateString: string | null | undefined): number {
  if (!dateString) return 0

  try {
    const normalized = normalizeDate(dateString)
    if (!normalized) return 0

    const futureDate = new Date(normalized + "T23:59:59.999Z")
    const today = new Date()

    const timeDiff = futureDate.getTime() - today.getTime()
    const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    return dayDiff > 0 ? dayDiff : 0
  } catch (error) {
    console.error("Error calculating remaining days:", error)
    return 0
  }
}

/**
 * Checks if a date is expired (past today)
 */
export function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false

  try {
    const normalized = normalizeDate(dateString)
    if (!normalized) return false

    const expirationDate = new Date(normalized + "T23:59:59.999Z")
    return expirationDate < new Date()
  } catch (error) {
    console.error("Error checking expiration:", error)
    return false
  }
}

/**
 * Gets days until expiration (negative if expired)
 */
export function getDaysUntilExpiration(dateString: string | null | undefined): number {
  if (!dateString) return 0

  try {
    const normalized = normalizeDate(dateString)
    if (!normalized) return 0

    const expirationDate = new Date(normalized + "T23:59:59.999Z")
    const diffTime = expirationDate.getTime() - new Date().getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error("Error calculating days until expiration:", error)
    return 0
  }
}

/**
 * Sanitizes a date string for storage
 * Ensures the year is not more than 4 digits
 */
export function sanitizeDateForStorage(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    if (dateString.includes("-")) {
      const parts = dateString.split("-")
      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].substring(0, 4)

        if (parts[2] && parts[2].includes("T")) {
          const dayAndTime = parts[2].split("T")
          return `${parts[0]}-${parts[1]}-${dayAndTime[0]}T${dayAndTime[1]}`
        }

        return parts.join("-")
      }
    }

    return dateString
  } catch (error) {
    console.error("Error sanitizing date for storage:", error)
    return dateString
  }
}