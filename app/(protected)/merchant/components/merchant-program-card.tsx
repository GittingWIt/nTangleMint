import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Program } from "@/types"

interface MerchantProgramCardProps {
  program: Program
}

export function MerchantProgramCard({ program }: MerchantProgramCardProps) {
  // Format date to readable string
  const formatDate = (date: Date | string) => {
    if (!date) return "No expiration"

    try {
      // Handle different date formats
      const dateObj = typeof date === "string" ? new Date(date) : date instanceof Date ? date : new Date()

      return dateObj.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid date"
    }
  }

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Get discount information
  const getDiscountInfo = () => {
    if (program.discount) {
      return program.discount
    }

    // Try to get from metadata
    if (program.metadata) {
      const { discountAmount, discountType } = program.metadata
      if (discountAmount && discountType) {
        return discountType === "percentage" ? `${discountAmount}% off` : `$${discountAmount} off`
      }
    }

    return "Special offer"
  }

  // Get product ID or UPC codes
  const getProductInfo = () => {
    if (program.productId) {
      return program.productId
    }

    if (program.metadata?.upcCodes && program.metadata.upcCodes.length > 0) {
      return `${program.metadata.upcCodes.length} products`
    }

    return "All products"
  }

  // Get participant count
  const getParticipantCount = () => {
    if (typeof program.participants === "number") {
      return program.participants
    }

    if (Array.isArray(program.participants)) {
      return program.participants.length
    }

    return 0
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{program.name}</CardTitle>
          <Badge className={getStatusColor(program.status)}>
            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{program.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Products: {getProductInfo()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              Expires:{" "}
              {program.expirationDate
                ? formatDate(program.expirationDate)
                : program.metadata?.expirationDate
                  ? formatDate(program.metadata.expirationDate)
                  : "No expiration"}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{getParticipantCount()} participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="font-medium">{getDiscountInfo()}</div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/merchant/program/${program.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}