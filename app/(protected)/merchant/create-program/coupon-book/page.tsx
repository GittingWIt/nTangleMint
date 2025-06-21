"use client"
import "@/lib/global-functions"
import CouponBookClient from "./coupon-book-client"

export default function CreateCouponBookPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Coupon Book Program</h1>
        <p className="text-muted-foreground">Create a new digital coupon book program for your customers.</p>
      </div>

      {/* Import the client component that handles the form */}
      <CouponBookClient />
    </div>
  )
}