"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, Building } from "lucide-react"

interface MerchantProfile {
  businessName: string
  description: string
  address: string
  phone: string
  email: string
  website: string
}

export function MerchantProfileEditor() {
  const [profile, setProfile] = useState<MerchantProfile>({
    businessName: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Load profile on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("merchantProfile")
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile))
      }
    } catch (error) {
      console.error("Error loading merchant profile:", error)
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      localStorage.setItem("merchantProfile", JSON.stringify(profile))
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error("Error saving merchant profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof MerchantProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Merchant Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={profile.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Enter your business name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="business@example.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            value={profile.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe your business..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profile.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={profile.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter your business address..."
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : isSaved ? "Saved!" : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  )
}