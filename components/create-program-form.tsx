"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { walletState, trackComponentMount } from "@/lib/wallet-sync"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UPCLookup } from "@/components/upc-lookup"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2 } from "lucide-react"
import { createCouponBookProgram } from "@/app/actions/create-program"
import { debug } from "@/lib/debug"

export function CreateProgramForm() {
  const router = useRouter()
  const { wallet } = useWallet()
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const mountedRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Track component mount for Fast Refresh detection
  useEffect(() => {
    trackComponentMount()
    mountedRef.current = true

    debug("CreateProgramForm component mounted")

    return () => {
      mountedRef.current = false
      debug("CreateProgramForm component unmounted")
    }
  }, [])

  async function onSubmit(formData: FormData) {
    if (!mountedRef.current) return

    try {
      setIsSubmitting(true)
      setError(null)

      debug("CreateProgramForm: Form submission started")

      // Get wallet data with multiple fallback strategies
      let currentWallet = null

      // 1. Try context first
      currentWallet = wallet
      debug("CreateProgramForm: Wallet from context:", currentWallet?.publicAddress)

      // 2. Try state container
      if (!currentWallet) {
        currentWallet = walletState.getWalletData(true)
        debug("CreateProgramForm: Wallet from state container:", currentWallet?.publicAddress)
      }

      // 3. Try direct storage access
      if (!currentWallet) {
        try {
          const storageData = localStorage.getItem("walletData")
          if (storageData) {
            currentWallet = JSON.parse(storageData)
            debug("CreateProgramForm: Wallet from storage:", currentWallet?.publicAddress)
          }
        } catch (error) {
          debug("CreateProgramForm: Storage access error:", error)
        }
      }

      if (!currentWallet?.publicAddress) {
        throw new Error("No wallet data found. Please ensure your wallet is connected.")
      }

      // Add wallet info to form data
      formData.append("walletAddress", currentWallet.publicAddress)
      formData.append("walletType", currentWallet.type)

      // Add required fields
      if (!date) {
        throw new Error("Please select an expiration date")
      }

      const upcCodes = selectedProducts.map((p) => p.upc).join(",")
      formData.append("upcCodes", upcCodes)
      formData.append("expirationDate", date.toISOString())

      debug("CreateProgramForm: Submitting form with wallet", currentWallet.publicAddress)
      const result = await createCouponBookProgram(formData)

      if (!mountedRef.current) return

      if (!result.success) {
        debug("CreateProgramForm: Form submission failed", result.error)
        throw new Error(result.error)
      }

      debug("CreateProgramForm: Program created successfully", result.programId)
      router.push("/merchant")
      router.refresh()
    } catch (err) {
      if (!mountedRef.current) return

      debug("CreateProgramForm: Error submitting form", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  useEffect(() => {
    const checkWalletBeforeSubmission = async () => {
      try {
        // Pre-warm the wallet state
        const currentWallet = walletState.getWalletData(true)
        debug("CreateProgramForm: Pre-submission wallet check:", currentWallet?.publicAddress)
      } catch (error) {
        debug("CreateProgramForm: Pre-submission check failed:", error)
      }
    }

    checkWalletBeforeSubmission()
  }, [])

  return (
    <form ref={formRef} action={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Program Name</Label>
        <Input id="name" name="name" required placeholder="Enter program name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required placeholder="Describe your program" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discountAmount">Initial Discount Amount</Label>
        <Input
          id="discountAmount"
          name="discountAmount"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="Set a base discount for all coupons in this book"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expirationDate">Program Expiration Date</Label>
        <DatePicker date={date} setDate={setDate} />
      </div>

      <div className="space-y-2">
        <Label>Eligible Products</Label>
        <UPCLookup onProductSelect={setSelectedProducts} selectedProducts={selectedProducts} />
        <p className="text-sm text-muted-foreground">
          Search for products by UPC or name to add them to your coupon program.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !wallet} data-testid="create-program-button">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Program...
          </>
        ) : (
          "Create Program"
        )}
      </Button>
    </form>
  )
}