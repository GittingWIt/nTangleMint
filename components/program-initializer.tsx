"use client"

import { useEffect, useRef } from "react"
import { forceProgramRecognition } from "@/lib/force-program-recognition"
import { debug } from "@/lib/debug"

export function ProgramInitializer() {
  // Use a ref to track if initialization has been done
  const initializedRef = useRef(false)

  useEffect(() => {
    // Only run once per component mount
    if (initializedRef.current) return
    initializedRef.current = true

    debug("ProgramInitializer mounted")

    // Force program recognition on mount
    forceProgramRecognition()

    // Also listen for wallet updates to re-run program recognition
    const handleWalletUpdated = () => {
      debug("Wallet updated, re-running program recognition")
      forceProgramRecognition()
    }

    window.addEventListener("walletUpdated", handleWalletUpdated)

    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdated)
    }
  }, [])

  return null
}