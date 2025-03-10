"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateProgramStatus } from "@/app/actions/update-program-status"
import type { Program } from "@/types"

interface ProgramStatusToggleProps {
  program: Program
  merchantAddress: string
}

export function ProgramStatusToggle({ program, merchantAddress }: ProgramStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: Program["status"]) => {
    setIsUpdating(true)
    try {
      const result = await updateProgramStatus(program.id, newStatus, merchantAddress)
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      // You might want to add toast notification here
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">Status: {program.status}</span>
      {program.status === "draft" ? (
        <Button onClick={() => handleStatusUpdate("active")} disabled={isUpdating} variant="default" size="sm">
          {isUpdating ? "Publishing..." : "Publish Program"}
        </Button>
      ) : program.status === "active" ? (
        <Button onClick={() => handleStatusUpdate("paused")} disabled={isUpdating} variant="outline" size="sm">
          {isUpdating ? "Pausing..." : "Pause Program"}
        </Button>
      ) : (
        <Button onClick={() => handleStatusUpdate("active")} disabled={isUpdating} variant="outline" size="sm">
          {isUpdating ? "Activating..." : "Activate Program"}
        </Button>
      )}
    </div>
  )
}