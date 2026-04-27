"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import type { Program } from "@/lib/types"
import { getProgramById } from "@/lib/services/program-service"
import { getProgramParticipantsOnChain } from "@/lib/services/onchain-state-service"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function ProgramDetailsPage() {
  const params = useParams()
  const programId = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [participantsLoading, setParticipantsLoading] = useState(false)

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        // Load program from storage
        const foundProgram = getProgramById(programId)

        if (!foundProgram) {
          setError("Program not found")
          setLoading(false)
          return
        }

        setProgram(foundProgram)

        // Fetch on-chain participant data
        setParticipantsLoading(true)
        try {
          const onChainData = await getProgramParticipantsOnChain(programId)
          setParticipantCount(onChainData.uniqueCustomers.size)
        } catch (err) {
          console.error("Failed to fetch on-chain participants:", err)
          setParticipantCount(0)
        } finally {
          setParticipantsLoading(false)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching program:", err)
        setError("Error fetching program details")
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Program not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Program Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{program.name}</CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </div>
              <Link href={`/programs/${program.id}/edit`}>
                <Button variant="outline">Edit Program</Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Program Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                On-Chain Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {participantsLoading ? (
                  <span className="text-sm text-muted-foreground">Loading...</span>
                ) : (
                  participantCount
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From blockchain</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Punches Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{program.requiredPunches}</div>
              <p className="text-xs text-muted-foreground mt-1">For reward</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">{formatDistanceToNow(new Date(program.createdAt), { addSuffix: true })}</div>
              <p className="text-xs text-muted-foreground mt-1">Program started</p>
            </CardContent>
          </Card>
        </div>

        {/* Program Details */}
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Reward</h4>
              <p className="text-base">{program.rewardDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Program ID</h4>
                <p className="text-xs font-mono text-muted-foreground break-all">{program.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Merchant</h4>
                <p className="text-xs font-mono text-muted-foreground break-all">{program.merchantAddress}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Block Height</h4>
                <p className="text-sm">{program.blockHeight || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}