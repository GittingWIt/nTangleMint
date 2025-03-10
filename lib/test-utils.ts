// Test utility functions for debugging and testing
import { getWalletData, setWalletData, debugStorage } from "@/lib/storage"
import { mockMerchantWallet } from "@/lib/mock/wallet-data"

// Basic test for coupon book creation
export function testCouponBookCreation() {
  if (typeof window === "undefined") return

  console.group("🧪 Testing Coupon Book Creation")

  try {
    // 1. Check if we're in the right environment
    console.log("Environment:", process.env.NODE_ENV)
    console.log("Test mode:", process.env.NEXT_PUBLIC_TEST_MODE)

    // 2. Check localStorage
    const walletData = localStorage.getItem("walletData")
    console.log("Wallet data in localStorage:", walletData ? "Present" : "Missing")

    // 3. Check session storage if available
    if (typeof sessionStorage !== "undefined") {
      console.log("Session storage available")
    }

    // 4. Check for wallet events
    console.log("Testing wallet event dispatch")
    window.dispatchEvent(new Event("walletUpdated"))
    console.log("Wallet event dispatched")

    // 5. Check form elements
    const createButton = document.querySelector('[data-testid="create-program-button"]')
    console.log("Create button found:", createButton ? "Yes" : "No")

    console.log("Test completed successfully")
    return true
  } catch (error) {
    console.error("Test failed:", error)
    return false
  } finally {
    console.groupEnd()
  }
}

// Comprehensive wallet state test
export async function testWalletStatePersistence() {
  if (typeof window === "undefined") return

  console.group("🧪 Testing Wallet State Persistence")

  try {
    // 1. Check initial wallet state
    console.log("Checking initial wallet state...")
    debugStorage()

    let wallet = await getWalletData()
    console.log("Initial wallet state:", wallet ? "Connected" : "Not connected")

    if (!wallet) {
      console.log("Loading mock wallet for testing...")
      await setWalletData(mockMerchantWallet)
      wallet = await getWalletData()
      console.log("Wallet loaded:", wallet ? "Success" : "Failed")
    }

    // 2. Test wallet persistence across page navigation
    console.log("Testing wallet persistence across navigation...")

    // Simulate page navigation by clearing and reloading wallet
    const savedWallet = { ...wallet }

    // 3. Test form submission wallet state
    console.log("Testing form submission wallet state...")

    // Create a mock form and simulate submission
    const mockForm = new FormData()
    mockForm.append("name", "Test Coupon Book")
    mockForm.append("description", "Test Description")
    mockForm.append("discountAmount", "10")
    mockForm.append("expirationDate", new Date(Date.now() + 86400000).toISOString())

    // Simulate form submission process
    console.log("Simulating form submission...")

    // Check wallet state before submission
    const preSubmitWallet = await getWalletData()
    console.log("Wallet before submission:", preSubmitWallet ? "Connected" : "Not connected")

    // Simulate server action call
    console.log("Simulating server action...")

    // Check wallet state after submission
    const postSubmitWallet = await getWalletData()
    console.log("Wallet after submission:", postSubmitWallet ? "Connected" : "Not connected")

    // 4. Verify wallet data consistency
    console.log("Verifying wallet data consistency...")
    const isConsistent =
      postSubmitWallet &&
      postSubmitWallet.publicAddress === savedWallet.publicAddress &&
      postSubmitWallet.type === savedWallet.type

    console.log("Wallet data consistency:", isConsistent ? "Consistent" : "Inconsistent")

    // 5. Test wallet event handling
    console.log("Testing wallet event handling...")
    let eventReceived = false

    const handleWalletUpdate = () => {
      eventReceived = true
      console.log("Wallet update event received")
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.dispatchEvent(new Event("walletUpdated"))

    // Wait a bit for event to process
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log("Wallet event received:", eventReceived ? "Yes" : "No")
    window.removeEventListener("walletUpdated", handleWalletUpdate)

    console.log("Test completed successfully")
    return {
      success: true,
      walletConsistent: isConsistent,
      eventHandling: eventReceived,
    }
  } catch (error) {
    console.error("Test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  } finally {
    console.groupEnd()
  }
}

// Test form submission specifically
export async function testFormSubmission() {
  if (typeof window === "undefined") return

  console.group("🧪 Testing Form Submission")

  try {
    // 1. Ensure wallet is loaded
    console.log("Ensuring wallet is loaded...")
    let wallet = await getWalletData()

    if (!wallet) {
      console.log("Loading mock wallet for testing...")
      await setWalletData(mockMerchantWallet)
      wallet = await getWalletData()
    }

    console.log("Wallet state:", wallet ? "Connected" : "Not connected")

    // 2. Find the form and button
    const form = document.querySelector("form") as HTMLFormElement
    const submitButton = document.querySelector('[data-testid="create-program-button"]') as HTMLButtonElement

    console.log("Form found:", form ? "Yes" : "No")
    console.log("Submit button found:", submitButton ? "Yes" : "No")

    if (!form || !submitButton) {
      console.log("Form or submit button not found, cannot proceed with test")
      return {
        success: false,
        error: "Form elements not found",
      }
    }

    // 3. Check if button is disabled
    console.log("Submit button disabled:", submitButton.disabled ? "Yes" : "No")

    if (submitButton.disabled) {
      console.log("Checking why button is disabled...")

      // Check wallet status
      const walletStatus = document.querySelector('[data-testid="wallet-status"]')?.textContent
      console.log("Wallet status element:", walletStatus || "Not found")

      // Check for error messages
      const errorMessages = Array.from(document.querySelectorAll('[role="alert"]')).map((el) => el.textContent)
      console.log("Error messages:", errorMessages.length ? errorMessages : "None")
    }

    // 4. Monitor wallet state during form submission
    console.log("Setting up wallet state monitoring...")

    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "attributes") {
          console.log("DOM changed during form submission")

          // Check for error messages
          const errorMessages = Array.from(document.querySelectorAll('[role="alert"]')).map((el) => el.textContent)
          if (errorMessages.length) {
            console.log("Error messages appeared:", errorMessages)
          }
        }
      })
    })

    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "disabled"],
    })

    console.log("Test completed successfully")
    return {
      success: true,
      formFound: !!form,
      buttonFound: !!submitButton,
      buttonDisabled: submitButton?.disabled,
    }
  } catch (error) {
    console.error("Test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  } finally {
    console.groupEnd()
  }
}

// Add to window for easy access in browser console
if (typeof window !== "undefined") {
  // @ts-ignore
  window.testCouponBookCreation = testCouponBookCreation
  // @ts-ignore
  window.testWalletStatePersistence = testWalletStatePersistence
  // @ts-ignore
  window.testFormSubmission = testFormSubmission
}