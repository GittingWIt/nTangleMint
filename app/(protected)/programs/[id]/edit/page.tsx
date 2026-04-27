"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Program } from "@/lib/types"
import { getProgramById, updateProgram, programHasActivePunches } from "@/lib/services/program-service"
import { getCurrentWallet } from "@/lib/services/wallet-service"
import { BITCOIN_DUST_LIMIT } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const editFormSchema = z.object({
  name: z.string().min(3, "Program name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  reward: z.string().min(3, "Reward description is required"),
  pricePerPunch: z.string().optional(),
  requiredPunches: z.string().optional(),
  expirationDate: z.string().optional(),
})

type EditFormValues = z.infer<typeof editFormSchema>

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasActivePunches, setHasActivePunches] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const merchant = getCurrentWallet()
  const merchantAddress = merchant?.address || ""

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      description: "",
      reward: "",
      pricePerPunch: "",
      requiredPunches: "",
      expirationDate: "",
    },
  })

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const foundProgram = getProgramById(programId)
        if (!foundProgram) {
          setError("Program not found")
          setLoading(false)
          return
        }

        setProgram(foundProgram)

        // Check if program has active punches
        const hasActive = programHasActivePunches(programId)
        setHasActivePunches(hasActive)

        // Set form values
        form.reset({
          name: foundProgram.name,
          description: foundProgram.description,
          reward: foundProgram.rewardDescription || "",
          pricePerPunch: String(foundProgram.metadata?.satoshisPerPunch || ""),
          requiredPunches: String(foundProgram.requiredPunches || ""),
          expirationDate: foundProgram.expiration?.estimatedExpirationDate?.split("T")[0] || "",
        })

        setLoading(false)
      } catch (err) {
        console.error("Error fetching program:", err)
        setError("Error fetching program details")
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId, form])

  const onSubmit = async (values: EditFormValues) => {
    setUpdateError(null)
    setSaving(true)

    try {
      const pricePerPunch = values.pricePerPunch ? parseInt(values.pricePerPunch) : undefined
      const requiredPunches = values.requiredPunches ? parseInt(values.requiredPunches) : undefined

      // Validate price if being changed
      if (pricePerPunch !== undefined && pricePerPunch > 0 && pricePerPunch < BITCOIN_DUST_LIMIT) {
        setUpdateError(`Price must be at least ${BITCOIN_DUST_LIMIT} satoshis`)
        setSaving(false)
        return
      }

      // Build update object based on whether punches exist
      const updateData: any = {
        name: values.name,
        description: values.description,
        rewardDescription: values.reward,
      }

      // Only allow editing price, punches, and expiration if no active punches
      if (!hasActivePunches) {
        if (pricePerPunch !== undefined && pricePerPunch > 0) {
          updateData.metadata = {
            ...program?.metadata,
            satoshisPerPunch: pricePerPunch,
          }
        }
        if (requiredPunches !== undefined && requiredPunches > 0) {
          updateData.requiredPunches = requiredPunches
        }
        if (values.expirationDate) {
          const newExpiration = new Date(values.expirationDate)
          if (newExpiration > new Date()) {
            updateData.expiration = {
              ...program?.expiration,
              estimatedExpirationDate: newExpiration.toISOString(),
            }
          } else {
            setUpdateError("Expiration date must be in the future")
            setSaving(false)
            return
          }
        }
      }

      const updated = updateProgram(programId, merchantAddress, updateData)

      if (updated) {
        router.push(`/programs/${programId}`)
      } else {
        setUpdateError("Failed to update program")
      }
    } catch (err) {
      console.error("Error updating program:", err)
      setUpdateError(err instanceof Error ? err.message : "Failed to update program")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Program not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/programs/${programId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Program
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Program</CardTitle>
          <CardDescription>Update your loyalty program details</CardDescription>
          {hasActivePunches && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This program has active punch cards. You can only edit the program name, description, and reward description. Price per punch and number of punches are locked to maintain fairness.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {updateError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              {/* Always Editable Fields */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Program name" {...field} />
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
                    <FormLabel>Program Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your program" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What customers will receive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditionally Editable Fields - Only if no active punches */}
              {!hasActivePunches && (
                <>
                  <FormField
                    control={form.control}
                    name="pricePerPunch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satoshis Per Punch</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Amount in satoshis" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum {BITCOIN_DUST_LIMIT} satoshis per punch
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiredPunches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Punches Required</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Number of punches" {...field} />
                        </FormControl>
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
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {hasActivePunches && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Satoshis Per Punch</p>
                    <p className="text-base font-semibold">{program.metadata?.satoshisPerPunch || "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Read-only (program has active punch cards)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Required Punches</p>
                    <p className="text-base font-semibold">{program.requiredPunches}</p>
                    <p className="text-xs text-muted-foreground mt-1">Read-only (program has active punch cards)</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/programs/${programId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}