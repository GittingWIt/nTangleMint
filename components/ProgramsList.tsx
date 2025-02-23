'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Program } from '@/lib/utils/program-utils'
import type { WalletData } from '@/types'

interface ProgramsListProps {
  programs: Program[]
  walletData: WalletData | null
  joinedPrograms: string[]
  onJoinProgram: (program: Program) => void
}

export function ProgramsList({
  programs,
  walletData,
  joinedPrograms,
  onJoinProgram
}: ProgramsListProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No programs found</p>
      </div>
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
              <span className="text-sm text-muted-foreground">
                {program.participants.length} participants
              </span>
              {walletData?.type === 'user' && (
                <Button
                  variant={joinedPrograms.includes(program.id) ? "secondary" : "default"}
                  onClick={() => onJoinProgram(program)}
                  disabled={joinedPrograms.includes(program.id)}
                >
                  {joinedPrograms.includes(program.id) ? 'Joined' : 'Join Program'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}