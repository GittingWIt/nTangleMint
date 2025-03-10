"use client"

import { WalletVerification } from "@/components/wallet-verification"
import { CreateProgramForm } from "@/components/create-program-form"

export default function CreateCouponBookPage() {
  return (
    <WalletVerification redirectPath="/wallet" showStatus>
      <div className="container mx-auto p-6 max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Create Coupon Book Program</h1>
          <p className="text-muted-foreground">Create a new digital coupon book program for your customers.</p>
        </div>
        <CreateProgramForm />
      </div>
    </WalletVerification>
  )
}