"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function BSVProgramCreator() {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rewardAmount: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create BSV transaction for program
      const merchantAddress = localStorage.getItem("merchantAddress")
      if (!merchantAddress) throw new Error("No merchant address")

      // This would use BSV Rust library to create transaction
      console.log("Creating BSV program transaction:", formData)

      // Mock success - replace with actual BSV transaction
      alert("Program created on BSV blockchain!")

      // Reset form
      setFormData({ name: "", description: "", rewardAmount: "" })
    } catch (error) {
      console.error("Failed to create BSV program:", error)
      alert("Failed to create program")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create BSV Loyalty Program</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Program Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="rewardAmount">Reward Amount (satoshis)</Label>
            <Input
              id="rewardAmount"
              type="number"
              value={formData.rewardAmount}
              onChange={(e) => setFormData((prev) => ({ ...prev, rewardAmount: e.target.value }))}
              required
            />
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? "Creating on BSV..." : "Create Program"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}