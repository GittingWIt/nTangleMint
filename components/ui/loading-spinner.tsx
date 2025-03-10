import { Loader2 } from "lucide-react"
import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className, ...props }: LoadingSpinnerProps & LucideProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} {...props} />
}