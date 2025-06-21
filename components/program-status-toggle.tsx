"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateProgram } from "@/lib/programs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Program } from "@/types"

interface ProgramStatusToggleProps {
  program: Program
  onStatusChange?: (newStatus: Program["status"]) => void
}

export function ProgramStatusToggle({ program, onStatusChange }: ProgramStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleStatusUpdate = async (newStatus: Program["status"]) => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      // Create updated program object
      const updatedProgram = {
        ...program,
        status: newStatus,
        isPublic: newStatus === "active",
        updatedAt: new Date().toISOString(),
      }

      // Update the program
      const result = await updateProgram(program.id, updatedProgram)

      if (result) {
        setSuccess(`Program ${newStatus === "active" ? "activated" : "deactivated"} successfully`)

        // Call the onStatusChange callback if provided
        if (onStatusChange) {
          onStatusChange(newStatus)
        }

        // Dispatch update event
        window.dispatchEvent(new Event("programsUpdated"))
      } else {
        setError("Failed to update program status")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          Current Status: <span className="font-bold capitalize">{program.status}</span>
        </span>
        {program.status === "active" ? (
          <Button onClick={() => handleStatusUpdate("paused")} disabled={isUpdating} variant="destructive">
            {isUpdating ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            {isUpdating ? "Deactivating..." : "Deactivate Program"}
          </Button>
        ) : (
          <Button onClick={() => handleStatusUpdate("active")} disabled={isUpdating}>
            {isUpdating ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            {isUpdating ? "Activating..." : "Activate Program"}
          </Button>
        )}
      </div>
    </div>
  )
}