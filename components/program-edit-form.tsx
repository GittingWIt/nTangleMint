"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CalendarIcon, Save, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { updateProgram } from "@/lib/programs"
import type { Program } from "@/lib/storage-service-compat"

// Define the form schema with conditional fields based on program type
const formSchema = z.object({
  name: z.string().min(3, { message: "Program name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  status: z.enum(["active", "paused", "draft", "expired"]),
  isPublic: z.boolean(),
  expirationDate: z.string().optional(),
  // Coupon book specific fields
  discountAmount: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  // Punch card specific fields
  requiredPunches: z.coerce.number().optional(),
  reward: z.string().optional(),
})

interface ProgramEditFormProps {
  program: Program
  onSave: () => void
  onCancel: () => void
}

export function ProgramEditForm({ program, onSave, onCancel }: ProgramEditFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUpcCode, setNewUpcCode] = useState("")
  const [upcCodes, setUpcCodes] = useState<string[]>(program.metadata?.upcCodes || [])

  // Initialize form with program data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: program.name,
      description: program.description,
      status: (program.status as "active" | "draft" | "paused" | "expired") || "active",
      isPublic: program.isPublic !== false, // Default to true if not specified
      expirationDate: program.metadata?.expirationDate || "",
      discountAmount: program.metadata?.discountAmount?.toString() || "",
      discountType: (program.metadata?.discountType as "percentage" | "fixed") || "percentage",
      requiredPunches: program.metadata?.requiredPunches || undefined,
      reward: program.metadata?.reward || "",
    },
  })

  const handleAddUpcCode = () => {
    if (!newUpcCode.trim()) return
    if (upcCodes.includes(newUpcCode.trim())) {
      setError("This UPC code already exists")
      return
    }
    setUpcCodes([...upcCodes, newUpcCode.trim()])
    setNewUpcCode("")
  }

  const handleRemoveUpcCode = (upcToRemove: string) => {
    setUpcCodes(upcCodes.filter((upc) => upc !== upcToRemove))
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true)
      setError(null)

      // Create updated program object with all required fields from the original program
      // Fix: Include the id and other required fields from the original program
      const updatedProgram = {
        ...program, // Include all original properties
        name: values.name,
        description: values.description,
        status: values.status,
        isPublic: values.isPublic,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...program.metadata,
          expirationDate: values.expirationDate || "", // Add fallback for TypeScript
        },
      }

      // Add program type specific metadata
      if (program.type === "coupon-book") {
        updatedProgram.metadata = {
          ...updatedProgram.metadata,
          discountAmount: values.discountAmount || "",
          discountType: values.discountType || "percentage",
          upcCodes: upcCodes,
        }
      } else if (program.type === "punch-card") {
        updatedProgram.metadata = {
          ...updatedProgram.metadata,
          requiredPunches: values.requiredPunches || 0, // Default to 0 if undefined
          reward: values.reward || "", // Default to empty string if undefined
          upcCodes: upcCodes, // Already initialized, won't be undefined
        }
      }

      // Update the program
      await updateProgram(program.id, updatedProgram)

      // Dispatch update event
      window.dispatchEvent(new Event("programsUpdated"))

      onSave()
    } catch (error) {
      console.error("Error saving program:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Program</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        value={field.value}
                        onChange={field.onChange}
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
                        <Input type="date" {...field} value={field.value || ""} />
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
                            value={field.value}
                            onChange={field.onChange}
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

            {/* UPC Codes section - for both program types */}
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

            <CardFooter className="flex justify-end gap-2 px-0">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
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
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProgramEditForm