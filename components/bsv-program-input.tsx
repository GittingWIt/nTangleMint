"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Search } from "lucide-react"

interface BSVProgramInputProps {
  onProgramSelect: (programId: string) => void
  placeholder?: string
  title?: string
}

/**
 * Simple BSV-first program input - replaces complex selector
 * Users input program ID directly or scan QR code
 */
export function BSVProgramInput({
  onProgramSelect,
  placeholder = "Enter program ID...",
  title = "Select Program",
}: BSVProgramInputProps) {
  const [programId, setProgramId] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async () => {
    if (!programId.trim()) return

    setIsValidating(true)
    try {
      // TODO: Replace with BSV Rust library validation
      // const isValid = await bsv_rust::validate_program_id(programId)

      // For now, basic validation
      if (programId.length > 10) {
        onProgramSelect(programId.trim())
      } else {
        throw new Error("Invalid program ID format")
      }
    } catch (error) {
      console.error("Program validation failed:", error)
      // Show error toast or validation message
    } finally {
      setIsValidating(false)
    }
  }

  const handleScanQR = () => {
    // TODO: Implement QR code scanning
    console.log("QR scan not implemented yet")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button variant="outline" size="icon" onClick={handleScanQR} title="Scan QR Code">
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleSubmit} disabled={!programId.trim() || isValidating} className="w-full">
          {isValidating ? "Validating..." : "Select Program"}
        </Button>
      </CardContent>
    </Card>
  )
}