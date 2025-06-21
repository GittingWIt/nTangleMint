import * as React from "react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "lg" | "default"
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "default", ...props }, ref) => {
    let sizeClass = "h-6 w-6"
    if (size === "sm") {
      sizeClass = "h-4 w-4"
    } else if (size === "lg") {
      sizeClass = "h-8 w-8"
    }
    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-dashed border-primary border-t-transparent",
          sizeClass,
          className,
        )}
        {...props}
      />
    )
  },
)
LoadingSpinner.displayName = "LoadingSpinner"