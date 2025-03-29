"use client"

import { useState, useEffect } from "react"
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
import { walletState } from "@/lib/wallet-sync"
import { saveProgram } from "@/lib/programs"
import { debug } from "@/lib/debug"
import { UPCLookup } from "@/components/upc-lookup"

// Define the Product type to match what UPCLookup expects
interface Product {
  upc: string
  name: string
  manufacturer: string
  category: string
}

// Form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Program name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  discountAmount: z.string().min(1, { message: "Discount amount is required" }),
  discountType: z.enum(["percentage", "fixed"], {
    required_error: "Please select a discount type",
  }),
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

export function CreateProgramForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletStatus, setWalletStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const router = useRouter()

  // Check wallet status on mount
  useEffect(() => {
    const checkWallet = () => {
      const wallet = walletState.getWalletData(true)

      if (wallet && wallet.publicAddress && wallet.type === "merchant") {
        setWalletStatus("valid")
      } else {
        setWalletStatus("invalid")
        setError("Your merchant wallet is not properly configured. Please refresh the page.")
      }
    }

    checkWallet()
  }, [])

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      discountAmount: "",
      discountType: "percentage",
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default to 30 days from now
      terms: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Check wallet connection
      const wallet = walletState.getWalletData(true)

      debug("Creating program with wallet:", {
        hasWallet: !!wallet,
        walletType: wallet?.type,
        address: wallet?.publicAddress?.substring(0, 10) + "...",
      })

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
        id: generateId(), // Use our custom ID generator instead of uuid
        type: "coupon-book" as const,
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
          discountAmount: values.discountAmount,
          discountType: values.discountType,
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
        <CardTitle>Program Details</CardTitle>
        <CardDescription>Fill out the form below to create a new coupon book program.</CardDescription>
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
                    <Input placeholder="Summer Discount Coupons" {...field} />
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
                      placeholder="Get exclusive discounts on our products with our digital coupon book."
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
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>The discount amount (e.g., 10 for 10% or $10).</FormDescription>
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
                    <FormDescription>Whether the discount is a percentage or fixed amount.</FormDescription>
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
                    <Textarea placeholder="Enter any terms and conditions for using these coupons." {...field} />
                  </FormControl>
                  <FormDescription>Optional terms and conditions for your program.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Products</FormLabel>
              <UPCLookup selectedProducts={selectedProducts} onProductSelect={setSelectedProducts} />
              <FormDescription>
                Search and add products that this coupon applies to by UPC code or name.
              </FormDescription>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push("/merchant/dashboard")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || walletStatus !== "valid" || selectedProducts.length === 0}
              >
                {isSubmitting ? "Creating..." : "Create Program"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}