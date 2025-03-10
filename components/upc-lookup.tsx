"use client"

import * as React from "react"
import { Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { debounce } from "lodash"

interface Product {
  upc: string
  name: string
  category: string
  manufacturer: string
}

// Mock database for demonstration
const mockProducts: Product[] = [
  {
    upc: "706970457638",
    name: "Freeze Dried Strawberry Slices",
    category: "Food Items > Cooking & Baking Ingredients > Meal",
    manufacturer: "Valley Food Storage",
  },
  {
    upc: "123456789012",
    name: "Organic Apples",
    category: "Food Items > Fresh Produce > Fruits",
    manufacturer: "Organic Farms",
  },
  {
    upc: "987654321098",
    name: "Whole Grain Bread",
    category: "Food Items > Bakery > Bread",
    manufacturer: "Healthy Bakery",
  },
  {
    upc: "456789123456",
    name: "Free Range Eggs",
    category: "Food Items > Dairy & Eggs > Eggs",
    manufacturer: "Happy Hens Farm",
  },
  // Add more mock products as needed
]

interface UPCLookupProps {
  onProductSelect: (products: Product[]) => void
  selectedProducts: Product[]
}

export function UPCLookup({ onProductSelect, selectedProducts }: UPCLookupProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Product[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [bulkUPCs, setBulkUPCs] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  // Debounced search function for real-time filtering
  const debouncedSearch = React.useCallback(
    debounce((term: string) => {
      setError(null)
      setIsSearching(true)

      // Simulate API lookup with mock data
      setTimeout(() => {
        const results = mockProducts.filter(
          (product) => product.upc.includes(term) || product.name.toLowerCase().includes(term.toLowerCase()),
        )

        if (results.length === 0 && term.length > 0) {
          setError("No products found with this UPC/name")
        }

        setSearchResults(results)
        setIsSearching(false)
      }, 300) // Simulate network delay
    }, 300),
    [],
  )

  // Effect to trigger search when searchTerm changes
  React.useEffect(() => {
    if (searchTerm.length > 0) {
      debouncedSearch(searchTerm)
    } else {
      setSearchResults([])
      setError(null)
    }
  }, [searchTerm, debouncedSearch])

  const handleBulkAdd = () => {
    // Split the text into individual UPCs and clean them
    const upcs = bulkUPCs
      .split(/[\n,]/) // Split by newline or comma
      .map((upc) => upc.trim())
      .filter((upc) => upc.length > 0) // Remove empty entries

    // Find products matching the UPCs
    const newProducts = upcs
      .map((upc) => mockProducts.find((product) => product.upc === upc))
      .filter((product): product is Product => product !== undefined)
      .filter((product) => !selectedProducts.some((p) => p.upc === product.upc))

    if (newProducts.length > 0) {
      onProductSelect([...selectedProducts, ...newProducts])
    }

    setBulkUPCs("") // Clear the input
  }

  const handleAdd = (product: Product) => {
    if (!selectedProducts.some((p) => p.upc === product.upc)) {
      onProductSelect([...selectedProducts, product])
    }
  }

  const handleRemove = (product: Product) => {
    onProductSelect(selectedProducts.filter((p) => p.upc !== product.upc))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="upc-search" className="sr-only">
            Search by UPC or product name
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="upc-search"
              placeholder="Enter UPC or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Add UPCs</DialogTitle>
              <DialogDescription>Enter multiple UPC codes, separated by commas or new lines</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Textarea
                placeholder="Enter UPCs here..."
                value={bulkUPCs}
                onChange={(e) => setBulkUPCs(e.target.value)}
                className="min-h-[200px]"
              />
              <Button onClick={handleBulkAdd}>Add UPCs</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {searchResults.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UPC</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((product) => (
                <TableRow key={product.upc}>
                  <TableCell className="font-mono">{product.upc}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.manufacturer}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAdd(product)}
                      disabled={selectedProducts.some((p) => p.upc === product.upc)}
                    >
                      {selectedProducts.some((p) => p.upc === product.upc) ? "Added" : "Add"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={4}>Selected Products ({selectedProducts.length})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.upc}>
                  <TableCell className="font-mono">{product.upc}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.manufacturer}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(product)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}