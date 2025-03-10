"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getProgram } from "@/lib/storage"
import { getWalletData } from "@/lib/storage"
import { updateProgram } from "@/lib/storage"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import type { Program, ProgramStatus, ProgramMetadata } from "@/types"

// Add this near the top of the file
const ERROR_MESSAGES = {
  VALIDATION: "Please fill in all required fields",
  SAVE: "Failed to save changes. Please try again.",
  UNAUTHORIZED: "You don't have permission to edit this program",
  NOT_FOUND: "Program not found",
  NETWORK: "Network error. Please check your connection.",
} as const

export default function ProgramDetails({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUpcCode, setNewUpcCode] = useState("")
  const [formData, setFormData] = useState<Partial<Program>>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        const wallet = await getWalletData()
        const programData = await getProgram(params.id)

        if (!programData) {
          setError(ERROR_MESSAGES.NOT_FOUND)
          return
        }

        if (wallet?.publicAddress !== programData.merchantAddress) {
          setError(ERROR_MESSAGES.UNAUTHORIZED)
          return
        }

        setProgram(programData)
        setFormData(programData)
      } catch (error) {
        console.error("Error loading program:", error)
        setError(ERROR_MESSAGES.NETWORK)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const handleStatusToggle = async () => {
    if (!program) return

    try {
      // Fix: Use proper ProgramStatus type instead of string
      const newStatus: ProgramStatus = program.status === "active" ? "paused" : "active"

      if (newStatus === "active") {
        const isValid = validateProgramData(formData)
        if (!isValid) {
          setError(ERROR_MESSAGES.VALIDATION)
          return
        }
      }

      const updatedProgram = {
        ...program,
        status: newStatus,
        isPublic: newStatus === "active",
        updatedAt: new Date().toISOString(),
      }

      // Update in storage
      await updateProgram(program.id, updatedProgram)

      // Update state
      setProgram(updatedProgram)
      setError(null)

      // Dispatch update event
      window.dispatchEvent(new Event("programsUpdated"))
    } catch (error) {
      console.error("Error updating status:", error)
      setError(ERROR_MESSAGES.SAVE)
    }
  }

  const validateProgramData = (data: Partial<Program>): boolean => {
    if (!data.name || !data.description) return false
    if (data.type === "coupon-book") {
      if (!data.metadata?.discountAmount) return false
      if (!data.metadata?.upcCodes?.length) return false
    }
    return true
  }

  const handleSave = async () => {
    if (!program || !formData) return

    try {
      setIsSaving(true)

      const isValid = validateProgramData(formData)
      if (!isValid) {
        setError(ERROR_MESSAGES.VALIDATION)
        return
      }

      // Fix: Ensure metadata properties are properly typed
      const updatedMetadata: ProgramMetadata = {
        ...program.metadata,
        ...(formData.metadata || {}),
        // Ensure discountAmount is always a string
        discountAmount: formData.metadata?.discountAmount || program.metadata.discountAmount || "",
        // Ensure upcCodes is always an array
        upcCodes: formData.metadata?.upcCodes || program.metadata.upcCodes || [],
      }

      const updatedProgram: Program = {
        ...program,
        name: formData.name || program.name,
        description: formData.description || program.description,
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString(),
      }

      // Update in storage
      await updateProgram(program.id, updatedProgram)

      // Update state
      setProgram(updatedProgram)
      setIsEditing(false)
      setError(null)

      // Dispatch update event
      window.dispatchEvent(new Event("programsUpdated"))
    } catch (error) {
      console.error("Error saving program:", error)
      setError(ERROR_MESSAGES.SAVE)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddUpcCode = () => {
    if (!newUpcCode.trim()) return

    const currentUpcCodes = formData.metadata?.upcCodes || []
    if (currentUpcCodes.includes(newUpcCode.trim())) {
      setError("This UPC code already exists")
      return
    }

    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        upcCodes: [...currentUpcCodes, newUpcCode.trim()],
      },
    })
    setNewUpcCode("")
  }

  const handleRemoveUpcCode = (upcToRemove: string) => {
    const currentUpcCodes = formData.metadata?.upcCodes || []
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        upcCodes: currentUpcCodes.filter((upc) => upc !== upcToRemove),
      },
    })
  }

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false)
      setFormData(program || {})
      setError(null)
    } else {
      router.push("/merchant")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || ERROR_MESSAGES.NOT_FOUND}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/merchant")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Back to Dashboard"}
          </Button>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "secondary" : "outline"}>
            {isEditing ? "Cancel Edit" : "Edit Program"}
          </Button>
          <Button onClick={handleStatusToggle} variant={program.status === "active" ? "destructive" : "default"}>
            {program.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            {program.type === "coupon-book" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={formData.metadata?.discountAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          discountAmount: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>UPC Codes</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.metadata?.upcCodes?.map((upc) => (
                      <Badge key={upc} variant="secondary" className="flex items-center gap-2">
                        {upc}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveUpcCode(upc)}
                            className="text-muted-foreground hover:text-foreground"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter UPC code"
                        value={newUpcCode}
                        onChange={(e) => setNewUpcCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddUpcCode()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddUpcCode}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {isEditing && (
            <Button className="mt-4" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Program Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="text-2xl font-bold">{program.stats?.participantCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rewards Issued</p>
              <p className="text-2xl font-bold">{program.stats?.rewardsIssued || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rewards Redeemed</p>
              <p className="text-2xl font-bold">{program.stats?.rewardsRedeemed || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}