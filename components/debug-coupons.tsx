"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { debug } from "@/lib/debug"
import { getCouponPrograms, type Program, createManualCoupon } from "@/lib/direct-storage-access"

export function DebugCoupons() {
  const [coupons, setCoupons] = useState<Program[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const checkStorage = () => {
    try {
      setError(null)
      setMessage("Checking storage for coupon programs...")

      // Get coupon programs directly from storage
      const couponPrograms = getCouponPrograms()

      // If no coupons found, add the manual coupon
      if (couponPrograms.length === 0) {
        const manualCoupon = createManualCoupon()
        couponPrograms.push(manualCoupon)
        setMessage(`No coupons found in storage, added manual coupon: ${manualCoupon.name}`)
      } else {
        setMessage(`Found ${couponPrograms.length} coupon programs`)
      }

      setCoupons(couponPrograms)

      // Log details of each coupon program
      couponPrograms.forEach((program, index) => {
        debug(`Coupon program ${index + 1}:`, {
          id: program.id,
          name: program.name,
          type: program.type || "inferred coupon",
          status: program.status,
          isPublic: program.isPublic,
          discount:
            program.discount ||
            (program.metadata?.discountAmount
              ? `${program.metadata.discountAmount}${program.metadata.discountType === "percentage" ? "%" : "$"}`
              : "none"),
        })
      })

      // Dispatch event for each coupon to ensure they're displayed
      couponPrograms.forEach((coupon) => {
        window.dispatchEvent(
          new CustomEvent("couponFound", {
            detail: { coupon },
          }),
        )
      })
    } catch (error) {
      console.error("Error checking storage:", error)
      setError(`Error: ${error.message}`)

      // Add manual coupon as fallback
      const manualCoupon = createManualCoupon()
      setCoupons([manualCoupon])
      window.dispatchEvent(
        new CustomEvent("couponFound", {
          detail: { coupon: manualCoupon },
        }),
      )
      setMessage("Added manual coupon as fallback due to error")
    }
  }

  // Check on mount
  useEffect(() => {
    checkStorage()

    // Set up interval to periodically check for coupons
    const intervalId = setInterval(() => {
      const currentCoupons = getCouponPrograms()
      if (currentCoupons.length !== coupons.length) {
        debug("Coupon count changed, refreshing")
        checkStorage()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(intervalId)
  }, [coupons.length])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Coupon Programs Debug</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button onClick={checkStorage} variant="outline" size="sm">
            Refresh Coupon Data
          </Button>

          {coupons.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Found Coupon Programs:</h3>
              {coupons.map((coupon, index) => (
                <div key={coupon.id || index} className="p-4 border rounded-md">
                  <p className="font-medium">{coupon.name}</p>
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {coupon.type || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {coupon.status || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">Public:</span> {coupon.isPublic === false ? "No" : "Yes"}
                    </div>
                    <div>
                      <span className="font-medium">Discount:</span>{" "}
                      {coupon.discount ||
                        (coupon.metadata?.discountAmount
                          ? `${coupon.metadata.discountAmount}${coupon.metadata.discountType === "percentage" ? "%" : "$"}`
                          : "None")}
                    </div>
                  </div>
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => {
                      // Create a custom event with the coupon data
                      window.dispatchEvent(
                        new CustomEvent("couponFound", {
                          detail: { coupon },
                        }),
                      )
                      setMessage(`Triggered couponFound event for ${coupon.name}`)
                    }}
                  >
                    Use This Coupon
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}