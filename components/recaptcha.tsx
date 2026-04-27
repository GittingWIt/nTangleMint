"use client"

import { useRef, useCallback, useEffect } from "react"
import ReCAPTCHA from "react-google-recaptcha"

interface ReCaptchaProps {
  onVerify: (token: string | null) => void
  onExpired?: () => void
  onError?: () => void
}

/**
 * ReCAPTCHA v2 component for human verification
 * Wraps Google reCAPTCHA with consistent styling and error handling
 */
export function ReCaptcha({ onVerify, onExpired, onError }: ReCaptchaProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  const handleChange = useCallback(
    (token: string | null) => {
      onVerify(token)
    },
    [onVerify]
  )

  const handleExpired = useCallback(() => {
    onVerify(null)
    onExpired?.()
  }, [onVerify, onExpired])

  const handleError = useCallback(() => {
    onVerify(null)
    onError?.()
  }, [onVerify, onError])

  // If no site key, allow in development/preview for testing
  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      // In development, auto-verify to allow testing without reCAPTCHA
      // This will still require verification in production
      useEffect(() => {
        onVerify("dev-bypass-token")
      }, [onVerify])
      return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          reCAPTCHA disabled (development mode) - verification bypassed for testing
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex justify-center">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        onErrored={handleError}
        theme="light"
      />
    </div>
  )
}

/**
 * Reset the reCAPTCHA widget programmatically
 * Call this after form submission to allow re-verification
 */
export function useReCaptchaReset() {
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const reset = useCallback(() => {
    recaptchaRef.current?.reset()
  }, [])

  return { recaptchaRef, reset }
}