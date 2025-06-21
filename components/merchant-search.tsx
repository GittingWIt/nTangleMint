"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { getAllMerchantProfiles } from "@/lib/merchant-profiles"

export function MerchantSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [allMerchants, setAllMerchants] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    try {
      const profiles = getAllMerchantProfiles()

      // Convert to array format
      const merchantsArray = Object.entries(profiles).map(([address, profile]) => ({
        address,
        profile,
      }))

      setAllMerchants(merchantsArray)
    } catch (error) {
      console.error("Error loading merchant profiles:", error)
    }
  }, [])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    const results = allMerchants.filter(({ profile }) => {
      const businessName = profile.businessName?.toLowerCase() || ""
      const description = profile.description?.toLowerCase() || ""
      const categories = profile.categories || []

      const searchLower = searchTerm.toLowerCase()

      return (
        businessName.includes(searchLower) ||
        description.includes(searchLower) ||
        categories.some((cat: string) => cat.toLowerCase().includes(searchLower))
      )
    })

    setSearchResults(results)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search merchants by name or category..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {isSearching && searchResults.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Search Results</h3>
            <div className="grid gap-2">
              {searchResults.map(({ address, profile }) => (
                <div key={address} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                  <div>
                    <div className="font-medium">{profile.businessName}</div>
                    {profile.categories && profile.categories.length > 0 && (
                      <div className="text-xs text-muted-foreground">{profile.categories.join(", ")}</div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/(protected)/merchants/${address}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isSearching && searchResults.length === 0 && searchTerm && (
        <div className="text-center p-4 mb-6 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No merchants found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}