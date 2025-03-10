import { getWalletData, getPrograms } from "@/lib/storage"
import type { Program } from "@/types"

interface ProgramCreationDiagnostics {
  success: boolean
  error?: string
  walletState: {
    found: boolean
    address?: string
    type?: string
  }
  couponBookState: {
    selectionRequired: boolean
    selectedId?: string
    found: boolean
    name?: string
  }
  formState: {
    hasRequiredFields: boolean
    missingFields: string[]
    validationErrors: Record<string, string>
  }
  navigationState: {
    currentPath: string
    expectedPath: string
    isCorrect: boolean
  }
  submissionState: {
    canSubmit: boolean
    blockingIssues: string[]
  }
}

export async function diagnoseProgramCreation(couponBookId?: string): Promise<ProgramCreationDiagnostics> {
  try {
    console.group("🔍 Diagnosing Program Creation Flow")

    // Check wallet state
    const wallet = await getWalletData()
    console.log("Wallet state:", wallet ? "Found" : "Not found", wallet?.type)

    // Check coupon books
    const programs = await getPrograms()
    const couponBooks = programs.filter((p) => p.type === "coupon-book")
    console.log("Available coupon books:", couponBooks.length)

    // Check selected coupon book
    let selectedCouponBook: Program | undefined
    if (couponBookId) {
      selectedCouponBook = couponBooks.find((cb) => cb.id === couponBookId)
      console.log("Selected coupon book:", selectedCouponBook?.name || "Not found")
    }

    // Check current path
    const currentPath = window.location.pathname
    const expectedPath = "/merchant/create-program/coupon-book"

    // Check form state
    const form = document.querySelector("form")
    const requiredFields = ["name", "description", "discountAmount", "expirationDate", "couponBookId"]
    const missingFields: string[] = []

    if (form) {
      requiredFields.forEach((field) => {
        const input = form.querySelector(`[name="${field}"]`)
        if (!input) {
          missingFields.push(field)
        }
      })
    }

    // Determine blocking issues
    const blockingIssues: string[] = []
    if (!wallet) blockingIssues.push("No wallet data found")
    if (!couponBookId) blockingIssues.push("No coupon book selected")
    if (missingFields.length > 0) blockingIssues.push("Missing required form fields")

    // Create wallet state object with proper handling of optional properties
    const walletState: ProgramCreationDiagnostics["walletState"] = {
      found: !!wallet,
    }

    // Only add address and type if they are defined
    if (wallet?.publicAddress) {
      walletState.address = wallet.publicAddress
    }

    if (wallet?.type) {
      walletState.type = wallet.type
    }

    // Create coupon book state with proper handling of optional properties
    const couponBookState: ProgramCreationDiagnostics["couponBookState"] = {
      selectionRequired: true,
      found: !!selectedCouponBook,
    }

    // Only add selectedId and name if they are defined
    if (couponBookId) {
      couponBookState.selectedId = couponBookId
    }

    if (selectedCouponBook?.name) {
      couponBookState.name = selectedCouponBook.name
    }

    return {
      success: blockingIssues.length === 0,
      walletState,
      couponBookState,
      formState: {
        hasRequiredFields: missingFields.length === 0,
        missingFields,
        validationErrors: {},
      },
      navigationState: {
        currentPath,
        expectedPath,
        isCorrect: currentPath === expectedPath,
      },
      submissionState: {
        canSubmit: blockingIssues.length === 0,
        blockingIssues,
      },
    }
  } catch (error) {
    console.error("Program creation diagnosis failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      walletState: {
        found: false,
      },
      couponBookState: {
        selectionRequired: true,
        found: false,
      },
      formState: {
        hasRequiredFields: false,
        missingFields: [],
        validationErrors: {},
      },
      navigationState: {
        currentPath: window.location.pathname,
        expectedPath: "",
        isCorrect: false,
      },
      submissionState: {
        canSubmit: false,
        blockingIssues: ["Diagnosis failed"],
      },
    }
  } finally {
    console.groupEnd()
  }
}