"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"

interface ReCaptchaProps {
  onVerify: (token: string | null) => void
  onExpired?: () => void
  onError?: () => void
}

/**
 * ReCAPTCHA v2 component for human verification
 * Wraps Google reCAPTCHA with consistent styling and error handling
 * In development mode (no NEXT_PUBLIC_RECAPTCHA_SITE_KEY), auto-verifies with a bypass token
 */
export function ReCaptcha({ onVerify, onExpired, onError }: ReCaptchaProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [verified, setVerified] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  const handleChange = useCallback(
    (token: string | null) => {
      if (token) {
        setVerified(true)
      }
      onVerify(token)
    },
    [onVerify]
  )

  const handleExpired = useCallback(() => {
    setVerified(false)
    onVerify(null)
    onExpired?.()
  }, [onVerify, onExpired])

  const handleError = useCallback(() => {
    setVerified(false)
    onVerify(null)
    onError?.()
  }, [onVerify, onError])

  // Development bypass: auto-verify if no site key is configured
  // Fires on component mount and triggers immediately
  useEffect(() => {
    if (!siteKey && !verified) {
      console.log("[v0] ReCaptcha: No site key detected, enabling dev bypass")
      const devToken = "dev-bypass-token"
      onVerify(devToken)
      setVerified(true)
    }
  }, [siteKey, verified, onVerify])

  if (!siteKey) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
        reCAPTCHA disabled (development mode) - verification bypassed for testing
      </div>
    )
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