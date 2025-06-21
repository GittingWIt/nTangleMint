"use client"

import "@/lib/global-functions"

import { useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MerchantProfilePage({ params }: { params: { address: string } }) {
  // Apply fixes when the component mounts
  useEffect(() => {
    // Fix for "i is not a function" error
    if (typeof window !== "undefined") {
      // Define i as a no-op function if it doesn't exist or isn't a function
      if (typeof (window as any).i !== "function") {
        ;(window as any).i = () => null
      }

      // Define s as a no-op function if it doesn't exist or isn't a function
      if (typeof (window as any).s !== "function") {
        ;(window as any).s = () => null
      }
    }
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Merchant Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Merchant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Address:</span>
              <span className="font-mono text-sm">{params.address}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Name:</span>
              <span>Local Merchant</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Status:</span>
              <span className="text-green-600">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}