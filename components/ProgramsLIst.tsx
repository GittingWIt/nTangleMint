"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { WalletData } from "@/lib/types"

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
  pointsPerReward?: number
}

interface ProgramsListProps {
  programs: ExtendedProgram[]
  walletData: WalletData | null
  joinedPrograms: string[]
  onJoinProgram: (program: ExtendedProgram) => void
}

export default function ProgramsList({ programs, walletData, joinedPrograms, onJoinProgram }: ProgramsListProps) {
  if (programs.length === 0) {
    return (
      <Alert>
        <AlertDescription>No programs found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <Card key={program.id}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{program.name}</h3>
              <p className="text-sm text-muted-foreground">{program.businessName}</p>
            </div>
            <p className="text-sm">{program.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{program.participants.length} participants</span>
              {walletData?.type !== "merchant" && walletData?.type !== "unknown" && (
                <Button
                  variant={joinedPrograms.includes(program.id) ? "secondary" : "default"}
                  onClick={() => onJoinProgram(program)}
                  disabled={joinedPrograms.includes(program.id)}
                >
                  {joinedPrograms.includes(program.id) ? "Earning" : "Start Earning"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}