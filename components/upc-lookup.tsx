"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Check, AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface UPCLookupProps {
  onProductSelect: (products: any[]) => void
  selectedProducts?: any[]
}

export function UPCLookup({ onProductSelect, selectedProducts = [] }: UPCLookupProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any[]>(selectedProducts || [])
  const [apiError, setApiError] = useState<string | null>(null)

  // Check if search term is a UPC code (numeric and 8-14 digits)
  const isUPCCode = (term: string) => {
    const cleanTerm = term.replace(/\D/g, "") // Remove non-digits
    return cleanTerm.length >= 8 && cleanTerm.length <= 14 && /^\d+$/.test(cleanTerm)
  }

  // Debounced search function
  const debouncedSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setApiError(null)
      return
    }

    setIsSearching(true)
    setApiError(null)

    try {
      let apiUrl = "/api/upc-lookup?"

      if (isUPCCode(term)) {
        const cleanUPC = term.replace(/\D/g, "")
        apiUrl += `upc=${cleanUPC}`
      } else {
        apiUrl += `search=${encodeURIComponent(term)}`
      }

      console.log("Calling API:", apiUrl)

      const response = await fetch(apiUrl)
      const data = await response.json()

      console.log("API Response:", data)

      if (data.success && data.products) {
        setSearchResults(data.products)
      } else {
        setSearchResults([])
        if (data.error) {
          setApiError(`API Error: ${data.error}`)
        }
      }
    } catch (error) {
      console.error("Error calling UPC API:", error)
      setSearchResults([])
      setApiError("Failed to connect to UPC database. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  // Toggle product selection
  const toggleProductSelection = (product: any) => {
    const isSelected = selected.some((p) => p.upc === product.upc)

    if (isSelected) {
      const updatedSelection = selected.filter((p) => p.upc !== product.upc)
      setSelected(updatedSelection)
      if (onProductSelect && typeof onProductSelect === "function") {
        onProductSelect(updatedSelection)
      }
    } else {
      const updatedSelection = [...selected, product]
      setSelected(updatedSelection)
      if (onProductSelect && typeof onProductSelect === "function") {
        onProductSelect(updatedSelection)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by UPC code or product name (uses live UPC database)"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              // Clear results immediately if search is empty
              if (!e.target.value.trim()) {
                setSearchResults([])
                setIsSearching(false)
                setApiError(null)
              }
            }}
          />
        </div>
      </div>

      {/* API Error Display */}
      {apiError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">UPC Database Error</p>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      {isSearching ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-sm text-muted-foreground">
            Searching {isUPCCode(searchTerm) ? "UPC database" : "product names"}...
          </span>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Found {searchResults.length} product{searchResults.length !== 1 ? "s" : ""} from UPC database
          </p>
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
      ) : searchTerm && !isSearching && !apiError ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products found matching "{searchTerm}"</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching with a UPC code or different product keywords
          </p>
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