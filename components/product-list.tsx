"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Product } from "@/lib/storage-service-compat"

interface ProductListProps {
  products: Product[]
  onRemove: (productId: string) => void
}

export function ProductList({ products, onRemove }: ProductListProps) {
  if (products.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No products added yet</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{product.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(product.id)}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 p-1 h-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {product.description && <p className="text-sm text-muted-foreground mt-1">{product.description}</p>}
            {product.price && <p className="mt-2 font-medium">${product.price}</p>}
            {product.upc && <p className="text-xs text-muted-foreground mt-1">UPC: {product.upc}</p>}
          </div>
        </Card>
      ))}
    </div>
  )
}