"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define the Product type to match what UPCLookup expects
interface Product {
  upc: string
  name: string
  manufacturer: string
  category: string
}

// Define the form values type to ensure type safety
type FormValues = {
  name: string
  description: string
  requiredPunches: string
  reward: string
  expirationDate: string
  terms: string
}

// Form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Program name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  requiredPunches: z.string().min(1, { message: "Required punches is required" }),
  reward: z.string().min(3, { message: "Reward description is required" }),
  expirationDate: z.string().refine(
    (val) => {
      const date = new Date(val)
      return date > new Date()
    },
    { message: "Expiration date must be in the future" },
  ),
  terms: z.string().optional(),
})

// Simple function to generate a unique ID without uuid dependency
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export default function PunchCardClient() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletStatus, setWalletStatus] = useState<"checking" | "valid" | "invalid">("checking")
  // Fix: Use the selectedProducts state but don't declare setSelectedProducts if we don't use it
  const [selectedProducts] = useState<Product[]>([])
  const router = useRouter()

  // Check wallet status on mount
  React.useEffect(() => {
    const checkWallet = async () => {
      try {
        // Dynamically import to prevent server-side issues
        const { getWalletData } = await import("@/lib/storage-compat")

        // Get wallet data
        const wallet = getWalletData()

        if (wallet && wallet.publicAddress && wallet.type === "merchant") {
          setWalletStatus("valid")
        } else {
          setWalletStatus("invalid")
          setError("Your merchant wallet is not properly configured. Please refresh the page.")
        }
      } catch (err) {
        console.error("Error checking wallet:", err)
        setWalletStatus("invalid")
        setError("Failed to check wallet status. Please refresh the page.")
      }
    }

    checkWallet()
  }, [])

  // Get default expiration date (30 days from now)
  const getDefaultExpirationDate = (): string => {
    const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    // Format the date directly as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Initialize form with explicit type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      requiredPunches: "10",
      reward: "Free item after 10 punches",
      expirationDate: getDefaultExpirationDate(),
      terms: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Dynamically import to prevent server-side issues
      const { getWalletData } = await import("@/lib/storage-compat")
      const { saveProgram } = await import("@/lib/programs")

      // Check wallet connection
      const wallet = getWalletData()

      if (!wallet || !wallet.publicAddress) {
        setError("Wallet not connected. Please refresh the page.")
        return
      }

      if (wallet.type !== "merchant") {
        setError("Only merchant wallets can create programs.")
        return
      }

      // Extract UPC codes from selected products
      const upcCodes = selectedProducts.map((product) => product.upc)

      // Create program object
      const program = {
        id: generateId(),
        type: "punch-card" as const,
        name: values.name,
        description: values.description,
        merchantAddress: wallet.publicAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active" as const,
        isPublic: true,
        version: 1,
        participants: [],
        metadata: {
          requiredPunches: Number.parseInt(values.requiredPunches, 10),
          reward: values.reward,
          expirationDate: values.expirationDate,
          terms: values.terms,
          upcCodes: upcCodes,
          products: selectedProducts,
        },
      }

      // Save program
      const result = await saveProgram(program)

      if (result) {
        // Manually trigger a programsUpdated event to refresh the dashboard
        window.dispatchEvent(new Event("programsUpdated"))

        // Add a small delay to ensure storage is updated before redirecting
        setTimeout(() => {
          router.push("/merchant/dashboard")
        }, 500)
      } else {
        setError("Failed to create program. Please try again.")
      }
    } catch (err) {
      console.error("Error creating program:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (walletStatus === "checking") {
    return <div className="text-center py-4">Checking wallet status...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Punch Card Details</CardTitle>
        <CardDescription>Fill out the form below to create a new punch card program.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
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
                    <Input placeholder="Coffee Loyalty Card" {...field} />
                  </FormControl>
                  <FormDescription>A short, descriptive name for your program.</FormDescription>
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
                    <Textarea
                      placeholder="Collect a punch with every coffee purchase. Get a free coffee after 10 punches!"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Explain the benefits of your program to customers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="requiredPunches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Punches</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>Number of punches needed to earn a reward.</FormDescription>
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
                      <Input placeholder="Free coffee" {...field} />
                    </FormControl>
                    <FormDescription>What customers earn after collecting all punches.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>When this program will expire.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any terms and conditions for using this punch card." {...field} />
                  </FormControl>
                  <FormDescription>Optional terms and conditions for your program.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Products</FormLabel>
              <div className="p-4 border rounded bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Product selection functionality is simplified in this implementation.
                </p>
              </div>
              <FormDescription>
                Search and add products that this punch card applies to by UPC code or name.
              </FormDescription>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push("/merchant/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || walletStatus !== "valid"}>
                {isSubmitting ? "Creating..." : "Create Program"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}