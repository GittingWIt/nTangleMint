"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { Product } from "@/lib/storage-service-compat"

interface ProductSelectorProps {
  onAddProduct: (product: Product) => void
}

export function ProductSelector({ onAddProduct }: ProductSelectorProps) {
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: "",
    upc: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name) return

    onAddProduct({
      id: `prod_${Date.now()}`,
      name: newProduct.name || "",
      description: newProduct.description || "",
      price: newProduct.price || "",
      upc: newProduct.upc || "",
      createdAt: new Date().toISOString(),
    })

    // Reset form
    setNewProduct({
      name: "",
      description: "",
      price: "",
      upc: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name</Label>
          <Input
            id="product-name"
            value={newProduct.name || ""}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            placeholder="Enter product name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Input
            id="product-description"
            value={newProduct.description || ""}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            placeholder="Enter product description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            value={newProduct.price || ""}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            placeholder="Enter product price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-upc">UPC Code</Label>
          <Input
            id="product-upc"
            value={newProduct.upc || ""}
            onChange={(e) => setNewProduct({ ...newProduct, upc: e.target.value })}
            placeholder="Enter product UPC code"
          />
        </div>
      </div>
      <Button type="submit">
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    </form>
  )
}