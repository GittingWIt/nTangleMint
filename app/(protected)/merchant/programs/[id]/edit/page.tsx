"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, CalendarIcon, X, Plus } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Simple interfaces
interface Program {
  id: string
  name: string
  description: string
  type: string
  status: "active" | "paused" | "draft" | "expired"
  merchantAddress: string
  createdAt: string
  updatedAt?: string
  isPublic: boolean
  participants: string[]
  expirationDate?: string
  metadata?: {
    discountAmount?: string
    discountType?: "percentage" | "fixed"
    expirationDate?: string
    isPublic?: boolean
    upcCodes?: string[]
    products?: any[]
    requiredPunches?: number
    reward?: string
  }
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Program name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "draft", "expired"]),
  discountAmount: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  expirationDate: z.string().optional(),
  isPublic: z.boolean().default(false),
  requiredPunches: z.number().optional(),
  reward: z.string().optional(),
})

/**
 * Normalizes a date string to a consistent format (YYYY-MM-DD)
 */
function normalizeDate(dateString: string): string {
  if (!dateString) return ""

  try {
    // Handle MM/DD/YYYY format
    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts.length === 3) {
        const year = parts[2] || ""
        const month = parts[0] ? parts[0].padStart(2, "0") : "01"
        const day = parts[1] ? parts[1].padStart(2, "0") : "01"
        return `${year}-${month}-${day}`
      }
    }

    // Handle ISO date format with time (strip the time part)
    if (dateString.includes("T")) {
      const parts = dateString.split("T")
      return parts[0] || dateString
    }

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // For any other format, parse with Date and format consistently
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }

    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`
  } catch (error) {
    console.error("Error normalizing date:", error)
    return dateString
  }
}

/**
 * Converts a date string to ISO format with time for storage
 */
function toStorageFormat(dateString: string): string {
  if (!dateString) return ""

  try {
    const normalizedDate = normalizeDate(dateString)
    return `${normalizedDate}T23:59:59.999Z`
  } catch (error) {
    console.error("Error converting date to storage format:", error)
    return dateString
  }
}

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [upcCodes, setUpcCodes] = useState<string[]>([])
  const [newUpcCode, setNewUpcCode] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      discountAmount: "",
      discountType: "percentage",
      expirationDate: "",
      isPublic: false,
      requiredPunches: undefined,
      reward: undefined,
    },
  })

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true)
        console.log("Looking for program with ID:", programId)

        // Get programs from localStorage
        const programsStr = localStorage.getItem("programs")
        const programs = programsStr ? JSON.parse(programsStr) : []

        // Find program by ID
        const foundProgram = programs.find((p: Program) => p.id === programId)

        if (!foundProgram) {
          setError(`Program with ID ${programId} not found`)
          setLoading(false)
          return
        }

        console.log("Found program:", foundProgram.name)
        setProgram(foundProgram)

        // Get expiration date from program and normalize it
        let expirationDate = foundProgram.metadata?.expirationDate || ""
        expirationDate = normalizeDate(expirationDate)

        // Initialize form data with normalized date
        form.setValue("name", foundProgram.name || "")
        form.setValue("description", foundProgram.description || "")
        form.setValue("status", foundProgram.status || "active")
        form.setValue("discountAmount", foundProgram.metadata?.discountAmount || "")
        form.setValue("discountType", foundProgram.metadata?.discountType || "percentage")
        form.setValue("expirationDate", expirationDate)
        form.setValue("isPublic", foundProgram.metadata?.isPublic || false)

        // Set UPC codes
        setUpcCodes(foundProgram.metadata?.upcCodes || [])

        setLoading(false)
      } catch (err) {
        console.error("Error fetching program:", err)
        setError("Error fetching program details")
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId, form])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true)
    setError(null)

    try {
      if (!program) {
        throw new Error("Program not found")
      }

      // Normalize the expiration date for consistent storage
      const normalizedDate = values.expirationDate?.trim() || ""

      // Update program with form data
      const updatedProgram: Program = {
        ...program,
        name: values.name,
        description: values.description || "",
        status: values.status,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...program.metadata,
          discountAmount: values.discountAmount || "",
          discountType: values.discountType || "percentage",
          expirationDate: normalizedDate,
          isPublic: values.isPublic,
          upcCodes: upcCodes,
        },
        isPublic: values.isPublic,
      }

      // Also update the main expirationDate field if it exists
      if ("expirationDate" in program) {
        updatedProgram.expirationDate = toStorageFormat(normalizedDate)
      }

      // Get all programs and update this one
      const programsStr = localStorage.getItem("programs")
      const programs = programsStr ? JSON.parse(programsStr) : []
      const updatedPrograms = programs.map((p: Program) => (p.id === programId ? updatedProgram : p))

      // Save back to localStorage
      localStorage.setItem("programs", JSON.stringify(updatedPrograms))
      console.log("Program updated successfully")

      setSuccess(true)
      setTimeout(() => {
        router.push(`/merchant/programs/${programId}`)
      }, 1500)
    } catch (err: any) {
      console.error("Error updating program:", err)
      setError(err.message || "Error updating program")
    } finally {
      setSaving(false)
    }
  }

  const handleAddUpcCode = () => {
    if (newUpcCode.trim() !== "") {
      setUpcCodes([...upcCodes, newUpcCode.trim()])
      setNewUpcCode("")
    }
  }

  const handleRemoveUpcCode = (upcToRemove: string) => {
    setUpcCodes(upcCodes.filter((upc) => upc !== upcToRemove))
  }

  const onCancel = () => {
    router.push(`/merchant/programs/${programId}`)
  }

  if (loading) {
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
          <AlertDescription>{error || "Program not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/merchant/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/merchant/programs/${programId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Program
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mt-2">Edit Program: {program.name}</h1>
      </div>

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-600">Program updated successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Program Name</Label>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter program name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Enter program description" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="draft">Draft</option>
                          <option value="expired">Expired</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Active programs are visible to users. Paused programs are temporarily hidden.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>When this program will expire</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Program</FormLabel>
                      <FormDescription>
                        Make this program visible to all users. Private programs are only visible to invited users.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Coupon Book specific fields */}
              {program.type === "coupon-book" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Amount ($)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Punch Card specific fields */}
              {program.type === "punch-card" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="requiredPunches"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Punches</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Number of punches needed to earn a reward</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>What customers earn after collecting all punches</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* UPC Codes section */}
              <FormItem>
                <FormLabel>UPC Codes</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {upcCodes.map((upc) => (
                    <Badge key={upc} variant="secondary" className="flex items-center gap-2">
                      {upc}
                      <button
                        type="button"
                        onClick={() => handleRemoveUpcCode(upc)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
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
                <FormDescription>Add UPC codes for products included in this program</FormDescription>

                {/* Display associated products if available */}
                {program.metadata?.products && program.metadata.products.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Associated Products</div>
                    <div className="space-y-2">
                      {program.metadata.products.map((product: any, index: number) => (
                        <div key={index} className="p-2 border rounded-md text-sm">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-muted-foreground">UPC: {product.upc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </FormItem>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 px-0">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
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
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}