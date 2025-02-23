"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const [selectedProgram, setSelectedProgram] = useState("")
  const [featureSlot, setFeatureSlot] = useState("")
  const [featurePrice, setFeaturePrice] = useState("")

  const handleFeatureProgram = () => {
    // Here you would implement the logic to feature the program
    console.log("Featuring program:", selectedProgram, "in slot:", featureSlot, "for price:", featurePrice)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">nTangleMint Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Feature Programs</CardTitle>
          <CardDescription>Select programs to feature on the home page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="program">Select Program</Label>
              <Select onValueChange={setSelectedProgram}>
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="program1">Program 1</SelectItem>
                  <SelectItem value="program2">Program 2</SelectItem>
                  <SelectItem value="program3">Program 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="slot">Feature Slot</Label>
              <Select onValueChange={setFeatureSlot}>
                <SelectTrigger id="slot">
                  <SelectValue placeholder="Select a slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage-top">Homepage Top</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="coupon-book">Coupon Book Highlight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Feature Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={featurePrice}
                onChange={(e) => setFeaturePrice(e.target.value)}
              />
            </div>

            <Button onClick={handleFeatureProgram}>Feature Program</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}