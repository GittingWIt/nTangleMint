"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft, Zap, Target } from "lucide-react"
import { getCurrentWallet } from "@/lib/services/wallet-service"
import { getPrivKeyWif, getStoredMnemonic, getStoredPassword } from "@/lib/services/wallet-service"
import { createProgram, PROGRAM_REGISTRATION_FEE } from "@/lib/services/program-service"
import { getCachedBlockHeight } from "@/lib/services/block-height-service"
import { getAddressBalance } from "@/lib/services/bsv-service"
import { PROGRAM_DEFAULTS, BITCOIN_DUST_LIMIT } from "@/lib/constants"
import { satoshisToUsd, formatBsv } from "@/lib/utils/conversion"
import Link from "next/link"

type FormValues = {
  name: string
  description: string
  requiredPunches: string
  reward: string
  pricePerPunch: string
  expirationDate: string
  terms: string
}

const formSchema = z.object({
  name: z.string().min(3, "Program name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requiredPunches: z.string().min(1, "Required punches is required"),
  reward: z.string().min(3, "Reward description is required"),
  pricePerPunch: z.string()
    .min(1, "Price per punch is required")
    .refine(
      (val) => {
        const price = parseInt(val, 10)
        return price >= BITCOIN_DUST_LIMIT
      },
      `Price must be at least ${BITCOIN_DUST_LIMIT} satoshis (Bitcoin dust limit)`
    ),
  expirationDate: z.string().refine(
    (val) => new Date(val) > new Date(),
    "Expiration date must be in the future"
  ),
  terms: z.string().optional(),
})

function getDefaultExpirationDate(): string {
  const date = new Date(Date.now() + PROGRAM_DEFAULTS.EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
  return date.toISOString().split("T")[0]
}

export default function CreatePunchCardPage() {
  const router = useRouter()
  const { wallet } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [blockHeight, setBlockHeight] = useState(0)
  const [bsvBalance, setBsvBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      requiredPunches: "2",
      reward: "",
      pricePerPunch: String(PROGRAM_DEFAULTS.SATOSHIS_PER_PUNCH),
      expirationDate: getDefaultExpirationDate(),
      terms: "",
    },
  })

  // Fetch block height and balance on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use wallet from context as primary source
        const walletToUse = wallet || getCurrentWallet()
        
        if (!walletToUse || !walletToUse.publicAddress) {
          console.log("[v0] No wallet found for balance fetch")
          setBalanceLoading(false)
          return
        }

        const [height, balanceData] = await Promise.all([
          getCachedBlockHeight(),
          getAddressBalance(walletToUse.publicAddress)
        ])
        
        console.log("[v0] Balance fetched:", balanceData)
        setBlockHeight(height)
        setBsvBalance(balanceData.total)
      } catch (err) {
        console.error("[v0] Error fetching balance:", err)
      } finally {
        setBalanceLoading(false)
      }
    }
    
    fetchData()
  }, [wallet])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const walletToUse = wallet || getCurrentWallet()
      if (!walletToUse) {
        setError("Wallet not connected")
        return
      }

      // Check if merchant has sufficient balance for program registration
      if (bsvBalance < PROGRAM_REGISTRATION_FEE) {
        setError(`Insufficient BSV balance. You need at least ${formatBsv(PROGRAM_REGISTRATION_FEE)} BSV (~$${satoshisToUsd(PROGRAM_REGISTRATION_FEE)}) to register a program on-chain.`)
        return
      }

      // Derive private key from stored mnemonic and password
      const mnemonic = getStoredMnemonic()
      const password = getStoredPassword()
      
      if (!mnemonic || !password) {
        setError("Wallet credentials not found. Please log in again.")
        return
      }

      let merchantPrivKeyWif: string
      try {
        merchantPrivKeyWif = getPrivKeyWif(mnemonic, password)
      } catch (err) {
        setError("Failed to derive private key. Please log in again.")
        return
      }

      // Create program locally (no blockchain broadcast yet)
      const program = createProgram(
        walletToUse.walletID, // Pass walletID first
        walletToUse.publicAddress,
        {
          name: values.name,
          description: values.description,
          requiredPunches: Number.parseInt(values.requiredPunches, 10),
          reward: values.reward,
          pricePerPunch: Number.parseInt(values.pricePerPunch, 10),
          expirationDays: calculateExpirationDays(values.expirationDate),
          isPublic: true,
          programType: values.requiredPunches === "1" ? "bogo" : "accumulation",
        }
      )

      console.log("[v0] Program created locally (inactive):", program.id)

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      console.error("[CreateProgram] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to create program")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to calculate days until expiration
  const calculateExpirationDays = (expirationDate: string): number => {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-50/20 dark:to-emerald-950/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-200/50 dark:border-emerald-900/30 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 p-4 mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Program Created</h2>
            <p className="text-muted-foreground text-center mb-6">
              Your punch card program is now live and ready for customers.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-50/20 dark:to-emerald-950/10 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Balance Warning */}
        {!balanceLoading && bsvBalance < PROGRAM_REGISTRATION_FEE && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Insufficient Balance</AlertTitle>
            <AlertDescription>
              You need at least {formatBsv(PROGRAM_REGISTRATION_FEE)} BSV (~${satoshisToUsd(PROGRAM_REGISTRATION_FEE)}) to register a program on the blockchain. 
              Your current balance: {formatBsv(bsvBalance)} BSV. 
              Please fund your wallet to continue.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4 bg-gradient-to-r from-background via-background to-emerald-50/30 dark:to-emerald-950/10 rounded-t-lg border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl">Create Punch Card</CardTitle>
                <CardDescription>
                  Design a loyalty program to reward your customers. Set rewards, pricing, and expiration terms.
                </CardDescription>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded" />
                    <h3 className="text-sm font-semibold text-foreground">Program Details</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Coffee Rewards" 
                            className="h-10 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                            {...field} 
                          />
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
                          <Textarea
                            placeholder="Tell customers about your program..."
                            className="min-h-24 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>This will be shown to customers when they browse programs.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Punch Card Rules */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded" />
                    <h3 className="text-sm font-semibold text-foreground">Punch Card Rules</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requiredPunches"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punches Required</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 border-emerald-200/50 focus:ring-emerald-500/50">
                                <SelectValue placeholder="Select punches" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Buy One Get One (1 Transaction)</SelectItem>
                              <SelectItem value="2">2 Punches</SelectItem>
                              <SelectItem value="4">4 Punches</SelectItem>
                              <SelectItem value="6">6 Punches</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Total transactions or punches required to earn reward</FormDescription>
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
                            <Input 
                              placeholder="e.g., Free Coffee"
                              className="h-10 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>What customers receive</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing & Dates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded" />
                    <h3 className="text-sm font-semibold text-foreground">Pricing & Duration</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="pricePerPunch"
                    render={({ field }) => {
                      const sats = Number.parseInt(field.value, 10) || 0
                      const usd = satoshisToUsd(sats)
                      const bsv = formatBsv(sats, 8)

                      return (
                        <FormItem>
                          <FormLabel>Price Per Punch</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              className="h-10 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                              placeholder="1000"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                form.trigger("pricePerPunch")
                              }}
                            />
                          </FormControl>
                          {sats > 0 && (
                            <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-3 p-3 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-lg">
                              <div className="font-semibold mb-1">{sats.toLocaleString()} satoshis</div>
                              <div className="text-xs text-amber-600/80 dark:text-amber-400/80">{bsv} BSV ≈ ${usd.toFixed(2)} USD</div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              className="h-10 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>When this program expires</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-2">
                      <FormLabel className="text-muted-foreground text-xs uppercase tracking-wider">Current Block Height</FormLabel>
                      <div className="h-10 px-3 rounded-md border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center">
                        <span className="text-sm font-mono font-semibold text-foreground">{blockHeight.toLocaleString()}</span>
                      </div>
                      <FormDescription>Testnet reference</FormDescription>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded" />
                    <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional terms for your program..."
                            className="min-h-20 border-emerald-200/50 focus-visible:ring-emerald-500/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={isSubmitting}
                    className="bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || bsvBalance < PROGRAM_REGISTRATION_FEE}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : bsvBalance < PROGRAM_REGISTRATION_FEE ? "Insufficient Balance" : "Create Program"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}