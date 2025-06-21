"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CouponBookFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export function CouponBookForm({ onSubmit, isSubmitting, error }: CouponBookFormProps) {
  const [date, setDate] = useState<Date>()

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form action={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Program Name</Label>
          <Input id="name" name="name" required placeholder="Enter program name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required placeholder="Describe your program" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountAmount">Initial Discount Amount</Label>
          <Input
            id="discountAmount"
            name="discountAmount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Set a base discount for all coupons in this book"
          />
        </div>

        <div className="space-y-2">
          <Label>Program Expiration Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <input type="hidden" name="expirationDate" value={date ? date.toISOString() : ""} />
        </div>

        <div className="space-y-2">
          <Label>Program Image</Label>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-[200px]">
              Upload Image
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Optional: Upload an image for your program.</p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Program..." : "Create Coupon Book Program"}
        </Button>
      </form>
    </div>
  )
}