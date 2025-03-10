"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Ticket, Gift } from 'lucide-react'
import { useRouter } from "next/navigation"
import type { Program } from "@/types"

interface ProgramCardProps {
  program: Program
  onJoin?: () => void
  userType?: "user" | "merchant" | null
  userWalletAddress?: string | null
}

export function ProgramCard({ program, onJoin, userType, userWalletAddress }: ProgramCardProps) {
  const router = useRouter()
  
  // Check if the current user is the program owner
  const isOwner = userType === "merchant" && userWalletAddress === program.merchantAddress
  
  // Helper function to get icon component based on program type
  const getProgramIcon = (type: string) => {
    switch (type) {
      case "punch-card":
        return <Store className="w-6 h-6" />
      case "coupon-book":
        return <Ticket className="w-6 h-6" />
      case "points":
        return <Gift className="w-6 h-6" />
      default:
        return <Store className="w-6 h-6" />
    }
  }

  // Helper function to get the appropriate button content
  const getActionButton = () => {
    if (isOwner) {
      return (
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={() => router.push(`/merchant/programs/${program.id}`)}
        >
          Manage Your Program
        </Button>
      )
    }
    
    if (!userType) {
      return (
        <Button className="w-full" onClick={onJoin}>
          Create Wallet to Join
        </Button>
      )
    }

    if (userType === "merchant") {
      return (
        <Button className="w-full" variant="secondary" disabled>
          Merchants Cannot Join Programs
        </Button>
      )
    }

    return (
      <Button className="w-full" onClick={onJoin}>
        Join Program
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          {getProgramIcon(program.type)}
          <Badge>{program.type}</Badge>
        </div>
        <CardTitle className="mt-4">{program.name}</CardTitle>
        <CardDescription>{program.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            By {program.metadata?.merchant || "Unknown Merchant"}
            {isOwner && <span className="ml-2 text-primary font-medium">(Your Program)</span>}
          </div>
          <div className="flex justify-between text-sm">
            <span>{program.stats?.participantCount || 0} participants</span>
            <span>{program.stats?.rewardsIssued || 0} rewards claimed</span>
          </div>
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  )
}