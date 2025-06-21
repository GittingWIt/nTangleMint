"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface UpcCodeListProps {
  upcCodes: string[]
  onRemove: (upc: string) => void
}

export function UpcCodeList({ upcCodes, onRemove }: UpcCodeListProps) {
  if (upcCodes.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No UPC codes added yet</div>
  }

  return (
    <div className="space-y-2">
      {upcCodes.map((upc) => (
        <div key={upc} className="flex items-center justify-between p-2 border rounded-md">
          <Badge variant="outline" className="font-mono">
            {upc}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(upc)}
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}