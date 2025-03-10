"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePrograms } from "@/hooks/use-programs"
import type { Program, ProgramType } from "@/types"

interface CouponBookSelectorProps {
  onSelect: (bookId: string) => void
  selectedId?: string
  className?: string
}

// Define an extended program type that includes the type property
interface ExtendedProgram extends Program {
  type: ProgramType
}

export function CouponBookSelector({ onSelect, selectedId, className }: CouponBookSelectorProps) {
  const [open, setOpen] = useState(false)
  const { programs } = usePrograms()

  // Filter to only show coupon books
  // Use type assertion to treat programs as ExtendedProgram[]
  const couponBooks = programs
    .filter((p): p is ExtendedProgram => "type" in p) // Type guard to ensure 'type' exists
    .filter((p) => p.type === "coupon-book")

  // Find selected book
  const selectedBook = couponBooks.find((book) => book.id === selectedId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedBook ? selectedBook.name : "Select a coupon book..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search coupon books..." />
          <CommandList>
            <CommandEmpty>No coupon books found.</CommandEmpty>
            <CommandGroup>
              {couponBooks.map((book) => (
                <CommandItem
                  key={book.id}
                  onSelect={() => {
                    onSelect(book.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedId === book.id ? "opacity-100" : "opacity-0")} />
                  {book.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}