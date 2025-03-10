"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { UPCLookup } from "@/components/upc-lookup"
import { useWalletData } from "@/hooks/use-wallet-data"
import { usePrograms } from "@/hooks/use-programs"
import { Loader2, Plus, Edit2, Save, X } from "lucide-react"

// Define the Product type to match what UPCLookup expects
interface Product {
  upc: string
  name: string
  manufacturer: string
  category: string
}

interface ProgramFormData {
  name: string
  description: string
  discountAmount: string
  expirationDate: Date | undefined
  products: Product[]
}

// Define a custom interface for our program data that includes the metadata we need
interface ProgramWithMetadata {
  id: string
  name: string
  description: string
  merchantAddress: string
  status: string
  metadata?: {
    discountAmount?: string
    expirationDate?: string
    upcCodes?: string[]
  }
}

export function ProgramManager() {
  const router = useRouter()
  const { walletData, isLoading: walletLoading } = useWalletData()

  // Only pass merchantAddress if walletData exists
  const { programs, refresh } = usePrograms(walletData ? { merchantAddress: walletData.publicAddress } : {})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    description: "",
    discountAmount: "",
    expirationDate: undefined,
    products: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate form data
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.discountAmount !== "" &&
      formData.expirationDate !== undefined &&
      formData.products.length > 0
    )
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!walletData) {
        throw new Error("Wallet not connected")
      }

      const response = await fetch("/api/programs", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          id: editingId,
          merchantAddress: walletData.publicAddress,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save program")
      }

      // Reset form and refresh programs
      setFormData({
        name: "",
        description: "",
        discountAmount: "",
        expirationDate: undefined,
        products: [],
      })
      setEditingId(null)
      refresh()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load program data for editing
  const handleEdit = (program: ProgramWithMetadata) => {
    setEditingId(program.id)
    setFormData({
      name: program.name,
      description: program.description || "",
      discountAmount: program.metadata?.discountAmount || "",
      expirationDate: program.metadata?.expirationDate ? new Date(program.metadata.expirationDate) : undefined,
      products:
        program.metadata?.upcCodes?.map((upc) => ({
          upc,
          name: "Product Name", // You would typically load this from your product database
          manufacturer: "Manufacturer",
          category: "General", // Added default category
        })) || [],
    })
  }

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      discountAmount: "",
      expirationDate: undefined,
      products: [],
    })
  }

  // Create a default date (30 days from now) for the DatePicker
  const defaultExpirationDate = new Date()
  defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30)

  // Handle date change with proper typing
  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, expirationDate: date }))
  }

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Program" : "Create New Program"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount</Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discountAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountAmount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <DatePicker date={formData.expirationDate || defaultExpirationDate} setDate={handleDateChange} />
            </div>

            <div className="space-y-2">
              <Label>Products</Label>
              <UPCLookup
                selectedProducts={formData.products}
                onProductSelect={(products) => setFormData((prev) => ({ ...prev, products }))}
              />
            </div>

            <div className="flex gap-2 justify-end">
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!isFormValid() || isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editingId ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Program
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          // Cast program to ProgramWithMetadata to access the properties we need
          const programWithMetadata = program as unknown as ProgramWithMetadata
          return (
            <Card key={programWithMetadata.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{programWithMetadata.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(programWithMetadata)}
                    disabled={isSubmitting}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit program</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {programWithMetadata.description || "No description"}
                </p>
                <div className="text-sm">
                  <p>Discount: ${programWithMetadata.metadata?.discountAmount || "0"}</p>
                  <p>Products: {programWithMetadata.metadata?.upcCodes?.length || 0}</p>
                  <p>
                    Expires:{" "}
                    {programWithMetadata.metadata?.expirationDate
                      ? new Date(programWithMetadata.metadata.expirationDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}