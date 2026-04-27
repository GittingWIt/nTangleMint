/**
 * Server-side reCAPTCHA token verification
 * Validates tokens with Google's siteverify API
 */

interface ReCaptchaVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
}

interface VerifyResult {
  success: boolean
  error?: string
}

/**
 * Verify a reCAPTCHA token server-side
 * @param token - The reCAPTCHA token from the client
 * @returns VerifyResult with success status and optional error message
 */
export async function verifyRecaptchaToken(token: string): Promise<VerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  // If no secret key configured, skip verification in development
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ReCAPTCHA] Secret key not configured, skipping verification")
      return { success: true }
    }
    return { success: false, error: "reCAPTCHA not configured" }
  }

  if (!token) {
    return { success: false, error: "reCAPTCHA token is required" }
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    if (!response.ok) {
      return { success: false, error: "Failed to verify reCAPTCHA" }
    }

    const data: ReCaptchaVerifyResponse = await response.json()

    if (data.success) {
      return { success: true }
    }

    // Map error codes to user-friendly messages
    const errorCodes = data["error-codes"] || []
    let errorMessage = "reCAPTCHA verification failed"

    if (errorCodes.includes("timeout-or-duplicate")) {
      errorMessage = "reCAPTCHA expired. Please try again."
    } else if (errorCodes.includes("invalid-input-response")) {
      errorMessage = "Invalid reCAPTCHA. Please try again."
    }

    return { success: false, error: errorMessage }
  } catch (error) {
    console.error("[ReCAPTCHA] Verification error:", error)
    return { success: false, error: "reCAPTCHA verification failed" }
  }
}