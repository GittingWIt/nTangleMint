"use client"
import { Button } from "@/components/ui/button"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface CouponBookClientProps {
  programId: string
}

export const CouponBookClient: React.FC<CouponBookClientProps> = ({ programId }) => {
  const [couponCode, setCouponCode] = useState("")

  const handleCreateCoupon = async () => {
    if (!couponCode) {
      console.error("Coupon code cannot be empty")
      return
    }

    try {
      const response = await fetch(`/api/programs/${programId}/coupon-books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode,
          walletAddress: "placeholder",
        }),
      })

      if (response.ok) {
        console.log({
          title: "Success",
          description: "Coupon created successfully!",
        })
        setCouponCode("") // Clear the input after successful creation
      } else {
        const errorData = await response.json()
        console.log({
          title: "Error",
          description: errorData.message || "Failed to create coupon. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.log({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Create Coupon</CardTitle>
        <CardDescription>Create a coupon for this program.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" onClick={handleCreateCoupon}>
          Create Coupon
        </Button>
      </CardContent>
    </Card>
  )
}