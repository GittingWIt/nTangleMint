"use client"

import { useEffect, useRef } from "react"
import { debug } from "@/lib/debug"
import { fixAllStorage } from "@/lib/storage-fix"
import { fixAllPrograms } from "@/lib/utils/program-utils"
import { forceProgramRecognition } from "@/lib/force-program-recognition"

export function ProgramFixer() {
  const fixedRef = useRef(false)

  useEffect(() => {
    // Remove the session storage check to ensure it runs every time
    const fixPrograms = async () => {
      // Prevent multiple executions
      if (fixedRef.current) return
      fixedRef.current = true

      try {
        debug("ProgramFixer: Starting program fixes")

        // First check and fix wallet type
        await forceProgramRecognition()

        // Run comprehensive storage fix
        fixAllStorage()

        // Run comprehensive program fix
        fixAllPrograms()

        // Mark as fixed in session storage
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("programFixerRun", "true")
        }

        // Dispatch event to notify components - but only once
        if (typeof window !== "undefined") {
          // Use a timeout to ensure we don't trigger too many events at once
          setTimeout(() => {
            window.dispatchEvent(new Event("programsUpdated"))
            window.dispatchEvent(new Event("walletUpdated"))
          }, 1000)
        }
      } catch (error) {
        console.error("Error in ProgramFixer:", error)
      }
    }

    // Use a timeout to ensure we don't run immediately
    const timer = setTimeout(() => {
      fixPrograms()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // This component doesn't render anything
  return null
}