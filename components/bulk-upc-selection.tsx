"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface UPCItem {
  code: string
  description: string
}

interface BulkUPCSelectionProps {
  items: UPCItem[]
  onSelect: (selectedItems: UPCItem[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkUPCSelection({ items, onSelect, open, onOpenChange }: BulkUPCSelectionProps) {
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = React.useState(false)

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((item) => item.code)))
    }
    setSelectAll(!selectAll)
  }

  const handleToggleItem = (code: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(code)) {
      newSelected.delete(code)
      setSelectAll(false)
    } else {
      newSelected.add(code)
      if (newSelected.size === items.length) {
        setSelectAll(true)
      }
    }
    setSelectedItems(newSelected)
  }

  const handleConfirm = () => {
    const selectedUPCs = items.filter((item) => selectedItems.has(item.code))
    onSelect(selectedUPCs)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Add UPC Codes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-2 pb-4">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All
            </label>
          </div>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.code}
                  className={cn(
                    "flex items-center space-x-4 rounded-lg border p-4",
                    selectedItems.has(item.code) && "bg-accent",
                  )}
                >
                  <Checkbox
                    id={item.code}
                    checked={selectedItems.has(item.code)}
                    onCheckedChange={() => handleToggleItem(item.code)}
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={item.code}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item.code}
                    </label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedItems.size === 0}>
            Add Selected ({selectedItems.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}