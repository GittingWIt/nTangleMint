"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WalletTypeSelectorProps {
  addresses: {
    customer: string
    merchant: string
  }
  onSelect: (type: "customer" | "merchant") => void
  onCancel: () => void
}

export function WalletTypeSelector({ addresses, onSelect, onCancel }: WalletTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<"customer" | "merchant" | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Wallet Type</h2>
        <p className="text-muted-foreground mt-2">
          This wallet has no blockchain metadata. Please select the wallet type:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${selectedType === "customer" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setSelectedType("customer")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🛍️ Customer Wallet</CardTitle>
            <CardDescription>For earning rewards and participating in loyalty programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Address Preview:</p>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">{addresses.customer}</p>
              <div className="text-sm text-muted-foreground">
                <p>• Earn loyalty points</p>
                <p>• Redeem rewards</p>
                <p>• Participate in programs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedType === "merchant" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setSelectedType("merchant")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🏪 Merchant Wallet</CardTitle>
            <CardDescription>For creating and managing loyalty programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Address Preview:</p>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">{addresses.merchant}</p>
              <div className="text-sm text-muted-foreground">
                <p>• Create loyalty programs</p>
                <p>• Manage customer rewards</p>
                <p>• Track business analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => selectedType && onSelect(selectedType)} disabled={!selectedType}>
          Continue as {selectedType === "customer" ? "Customer" : "Merchant"}
        </Button>
      </div>
    </div>
  )
}