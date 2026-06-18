'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface FilterPanelProps {
  filters: {
    programName: string
    priceMin: number
    priceMax: number
    seller: string
  }
  onFiltersChange: (filters: any) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const handleReset = () => {
    onFiltersChange({
      programName: '',
      priceMin: 0,
      priceMax: 10000000,
      seller: '',
    })
  }

  return (
    <Card className="p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Filters</h3>
        {(filters.programName || filters.seller || filters.priceMin > 0 || filters.priceMax < 10000000) && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Program Name */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Program Name</label>
          <Input
            placeholder="Search program..."
            value={filters.programName}
            onChange={(e) =>
              onFiltersChange({ ...filters, programName: e.target.value })
            }
            className="h-9"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Price Range (sats)</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Minimum</label>
              <Input
                type="number"
                placeholder="Min price"
                value={filters.priceMin}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceMin: parseInt(e.target.value) || 0,
                  })
                }
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Maximum</label>
              <Input
                type="number"
                placeholder="Max price"
                value={filters.priceMax}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    priceMax: parseInt(e.target.value) || 10000000,
                  })
                }
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Seller Address */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Seller Address</label>
          <Input
            placeholder="Seller address..."
            value={filters.seller}
            onChange={(e) =>
              onFiltersChange({ ...filters, seller: e.target.value })
            }
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>
    </Card>
  )
}