"use client"

import { useEffect } from "react"
import { STORAGE_KEYS, STORAGE_EVENTS } from "@/lib/constants"
import { addProgram, getPrograms } from "@/lib/storage"
import { debug } from "@/lib/debug"

export function ProgramSync() {
  useEffect(() => {
    // Update the syncPrograms function to handle both cookie and localStorage sync
    const syncPrograms = async () => {
      try {
        // Get existing programs from localStorage
        const existingPrograms = await getPrograms()

        // Check for new program in cookies
        const cookies = document.cookie.split(";").reduce(
          (acc, cookie) => {
            const parts = cookie.trim().split("=")
            // Only process cookies with valid key-value pairs
            if (parts.length === 2) {
              const key = parts[0]
              const value = parts[1]
              // Ensure both key and value are defined
              if (key && value !== undefined) {
                acc[key] = value
              }
            }
            return acc
          },
          {} as Record<string, string>,
        )

        // Handle newly created program
        if (cookies.last_created_program) {
          try {
            const program = JSON.parse(decodeURIComponent(cookies.last_created_program))

            // Add to existing programs if not already present
            if (!existingPrograms.some((p: any) => p.id === program.id)) {
              await addProgram(program)
              debug("Program synced from cookie:", program.id)

              // Dispatch event to notify components
              window.dispatchEvent(new CustomEvent("programsUpdated"))
              window.dispatchEvent(
                new CustomEvent(STORAGE_EVENTS.PROGRAM_CREATED, {
                  detail: { program },
                }),
              )
            }

            // Clear the cookie after processing
            document.cookie = "last_created_program=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "program_action=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          } catch (e) {
            console.error("Error processing program cookie:", e)
          }
        }
      } catch (error) {
        console.error("Error syncing programs:", error)
      }
    }

    // Initial sync
    syncPrograms()

    // Listen for storage events
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.PROGRAMS) syncPrograms()
    }

    // Set up event listeners
    window.addEventListener("storage", handleStorageEvent)
    window.addEventListener("programsUpdated", syncPrograms)
    window.addEventListener(STORAGE_EVENTS.STORAGE_SYNC, syncPrograms)

    return () => {
      window.removeEventListener("storage", handleStorageEvent)
      window.removeEventListener("programsUpdated", syncPrograms)
      window.removeEventListener(STORAGE_EVENTS.STORAGE_SYNC, syncPrograms)
    }
  }, [])

  return null
}