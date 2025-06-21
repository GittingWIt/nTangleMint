"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Users } from "lucide-react"
import type { WalletData } from "@/types"

// Define Program type inline until we establish the correct shared location
type ProgramType = "punch-card" | "points" | "tiered" | "coalition"

// Define the ExtendedProgram interface
interface ExtendedProgram {
  id: string
  name: string
  businessName?: string
  description?: string
  type: ProgramType
  category?: string
  participants: string[]
  merchantAddress?: string // Add this line
  pointsPerReward?: number
  expirationDate?: string
  status?: string
  metadata?: {
    expirationDate?: string
    discountAmount?: string
    discountType?: string
    requiredPunches?: number
    reward?: string
  }
}

interface ProgramsListProps {
  programs: ExtendedProgram[]
  walletData: WalletData | null
  joinedPrograms: string[]
  onJoinProgram: (program: ExtendedProgram) => void
  isMerchant?: boolean
}

export default function ProgramsList({
  programs,
  walletData,
  joinedPrograms,
  onJoinProgram,
  isMerchant,
}: ProgramsListProps) {
  // Function to check if a program is expired
  const checkIfExpired = (program: ExtendedProgram): boolean => {
    const expirationDate = program.expirationDate || program.metadata?.expirationDate
    if (!expirationDate) return false

    console.log("🔥 Checking expiration for:", program.name, "Date:", expirationDate)

    // Handle both date formats: "2025-04-25" and "4/24/2025"
    const expDate = new Date(expirationDate)
    const today = new Date()

    // Set time to compare dates only (not time)
    expDate.setHours(23, 59, 59, 999) // End of expiration day
    today.setHours(0, 0, 0, 0) // Start of today

    const isExpired = today > expDate
    console.log(
      "🔥 Program expired status:",
      isExpired,
      "Today:",
      today.toDateString(),
      "Expires:",
      expDate.toDateString(),
    )

    return isExpired
  }

  // Function to format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No expiration"

    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })

    if (diffDays < 0) {
      return `${formattedDate} (${Math.abs(diffDays)} days ago)`
    } else if (diffDays === 0) {
      return `${formattedDate} (expires today)`
    } else {
      return `${formattedDate} (${diffDays} days left)`
    }
  }

  if (programs.length === 0) {
    return (
      <Alert>
        <AlertDescription>No programs found</AlertDescription>
      </Alert>
    )
  }

  // Determine if user is a merchant either from prop or wallet data
  const userIsMerchant = isMerchant || walletData?.type === "merchant"

  console.log("🔥 ProgramsList rendering with", programs.length, "programs")

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => {
        const isExpired = checkIfExpired(program)
        const expirationDate = program.expirationDate || program.metadata?.expirationDate

        return (
          <Card key={program.id} className={isExpired ? "border-red-200 bg-red-50/30" : ""}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">{program.name}</h3>
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      isExpired
                        ? "border-transparent bg-red-100 text-red-800"
                        : "border-transparent bg-green-100 text-green-800"
                    }`}
                  >
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{program.businessName}</p>
              </div>

              <p className="text-sm">{program.description}</p>

              {/* Expiration date display */}
              {expirationDate && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span className={isExpired ? "text-red-600 font-medium" : ""}>
                    Expires: {formatDate(expirationDate)}
                  </span>
                </div>
              )}

              {/* Participants count */}
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>{program.participants.length} participants</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{program.type?.replace("-", " ") || "Program"}</span>

                {/* Show different buttons based on user type */}
                {userIsMerchant ? (
                  // Merchant view - show View Details or Manage
                  <Button variant="default" onClick={() => onJoinProgram(program)}>
                    {program.merchantAddress === walletData?.publicAddress ? "Manage" : "View Details"}
                  </Button>
                ) : (
                  // Customer view - show Join Program or Joined
                  walletData?.type === "customer" && (
                    <Button
                      variant={joinedPrograms.includes(program.id) ? "secondary" : "default"}
                      onClick={() => onJoinProgram(program)}
                      disabled={joinedPrograms.includes(program.id) || isExpired}
                    >
                      {joinedPrograms.includes(program.id) ? "Joined" : isExpired ? "Expired" : "Join Program"}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}