"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Gift, Tag } from "lucide-react"
import { format } from "date-fns"
import type { Program } from "@/types"

interface MerchantProgramCardProps {
  program: Program
}

export function MerchantProgramCard({ program }: MerchantProgramCardProps) {
  const router = useRouter()

  // Add a guard clause to prevent rendering with undefined program
  if (!program) {
    return null
  }

  // Format expiration date with null check
  const expirationDate = program.metadata?.expirationDate
    ? format(new Date(program.metadata.expirationDate), "PPP")
    : "No expiration"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{program.name}</CardTitle>
            <CardDescription className="mt-2">{program.description}</CardDescription>
          </div>
          <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {program.metadata?.discountAmount || "0"}
                {program.metadata?.discountType === "percentage" ? "%" : "$"} off
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{expirationDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{program.stats?.participantCount || 0} participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{program.stats?.rewardsRedeemed || 0} redeemed</span>
            </div>
          </div>

          {program.metadata?.upcCodes && program.metadata.upcCodes.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Eligible Products</p>
              <div className="flex flex-wrap gap-2">
                {program.metadata.upcCodes.slice(0, 3).map((upc) => (
                  <Badge key={upc} variant="secondary">
                    {upc}
                  </Badge>
                ))}
                {program.metadata.upcCodes.length > 3 && (
                  <Badge variant="secondary">+{program.metadata.upcCodes.length - 3} more</Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => router.push(`/merchant/programs/${program.id}`)}>
              Manage Program
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}