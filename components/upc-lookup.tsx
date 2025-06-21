"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Check } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Mock UPC database for demo purposes
const mockUpcDatabase = [
  {
    upc: "706970457638",
    name: "Freeze Dried Strawberry Slices",
    manufacturer: "Valley Food Storage",
    category: "Dried Fruits",
    verified: true,
  },
  {
    upc: "049022889012",
    name: "Regular Coffee",
    manufacturer: "Local Coffee Shop",
    category: "Beverages",
    verified: false,
  },
  {
    upc: "049022889029",
    name: "Cappuccino",
    manufacturer: "Local Coffee Shop",
    category: "Beverages",
    verified: false,
  },
]

interface UPCLookupProps {
  onProductSelect: (products: any[]) => void
  selectedProducts?: any[]
}

export function UPCLookup({ onProductSelect, selectedProducts = [] }: UPCLookupProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any[]>(selectedProducts || [])

  // Search for products by UPC or name
  const handleSearch = () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)

    // Simulate API call delay
    setTimeout(() => {
      const results = mockUpcDatabase.filter(
        (product) =>
          product.upc.includes(searchTerm) ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  // Toggle product selection
  const toggleProductSelection = (product: any) => {
    const isSelected = selected.some((p) => p.upc === product.upc)

    if (isSelected) {
      const updatedSelection = selected.filter((p) => p.upc !== product.upc)
      setSelected(updatedSelection)
      onProductSelect(updatedSelection)
    } else {
      const updatedSelection = [...selected, product]
      setSelected(updatedSelection)
      onProductSelect(updatedSelection)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by UPC code or product name"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Search
        </Button>
      </div>

      {isSearching ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-2">
          {searchResults.map((product) => {
            const isSelected = selected.some((p) => p.upc === product.upc)
            return (
              <Card
                key={product.upc}
                className={`hover:bg-muted/50 transition-colors ${isSelected ? "border-primary bg-primary/5" : ""}`}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{product.name}</h4>
                      {product.verified && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">Verified</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{product.manufacturer}</div>
                    <div className="text-xs font-mono mt-1">{product.upc}</div>
                  </div>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleProductSelection(product)}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Select
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : searchTerm && !isSearching ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products found matching "{searchTerm}"</p>
        </div>
      ) : null}

      {selected.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Selected Products ({selected.length})</h3>
          <div className="space-y-2">
            {selected.map((product) => (
              <div key={product.upc} className="flex justify-between items-center p-2 border rounded bg-muted/20">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs font-mono">{product.upc}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => toggleProductSelection(product)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}