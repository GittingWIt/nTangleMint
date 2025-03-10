"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  className?: string
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date ? format(date, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const selectedDate = e.target.valueAsDate
            if (selectedDate) {
              // Adjust for timezone offset to ensure the correct date is selected
              const timezoneOffset = selectedDate.getTimezoneOffset() * 60000
              const adjustedDate = new Date(selectedDate.getTime() + timezoneOffset)
              setDate(adjustedDate)
            } else {
              setDate(undefined)
            }
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          min={format(new Date(), "yyyy-MM-dd")}
        />
        <Button type="button" variant="outline" className="h-10 w-10 p-0" onClick={() => setDate(new Date())}>
          <CalendarIcon className="h-4 w-4" />
          <span className="sr-only">Select today's date</span>
        </Button>
      </div>
      {date && <p className="text-sm text-muted-foreground">Selected: {format(date, "PPP")}</p>}
    </div>
  )
}