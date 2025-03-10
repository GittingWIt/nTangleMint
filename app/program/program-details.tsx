"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Users, Trophy, Wallet, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getWalletData } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Program } from "@/types"
import { PROGRAM_TYPES } from "@/lib/constants"

interface ProgramDetailsProps {
  programId: string
}

// Define an extended program type that includes the properties we need
interface ExtendedProgram extends Program {
  participants: string[]
  businessName: string
  rewards: Array<{
    description: string
    threshold: number
  }>
  rewards_claimed: number
  isOpenEnded: boolean
  merchant_address: string
  nftDesign?: {
    image?: string
  }
}

export default function ProgramDetails({ programId }: ProgramDetailsProps) {
  const router = useRouter()
  const [program, setProgram] = useState<ExtendedProgram | null>(null)
  const [walletData, setWalletData] = useState<Awaited<ReturnType<typeof getWalletData>> | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load wallet data
        const data = await getWalletData()
        setWalletData(data)

        // Load program data
        // In production, this would be an API call
        const globalPrograms = JSON.parse(localStorage.getItem("globalPrograms") || "[]")
        const foundProgram = globalPrograms.find((p: ExtendedProgram) => p.id === programId)

        if (!foundProgram) {
          setError("Program not found")
          return
        }

        setProgram(foundProgram)

        // Check if user has already joined
        if (data?.type === "user") {
          const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${data.publicAddress}`) || "[]")
          setIsJoined(userPrograms.includes(programId))
        }
      } catch (err) {
        console.error("Error loading program:", err)
        setError("Failed to load program details")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [programId])

  const handleJoinProgram = async () => {
    if (!walletData || !program) return

    try {
      setJoinLoading(true)
      setError(null)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update program participants
      const globalPrograms = JSON.parse(localStorage.getItem("globalPrograms") || "[]")
      const updatedPrograms = globalPrograms.map((p: ExtendedProgram) => {
        if (p.id === program.id) {
          return { ...p, participants: [...p.participants, walletData.publicAddress] }
        }
        return p
      })
      localStorage.setItem("globalPrograms", JSON.stringify(updatedPrograms))

      // Add to user's programs
      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${walletData.publicAddress}`) || "[]")
      userPrograms.push(program.id)
      localStorage.setItem(`userPrograms_${walletData.publicAddress}`, JSON.stringify(userPrograms))

      setIsJoined(true)
    } catch (err) {
      console.error("Error joining program:", err)
      setError("Failed to join program")
    } finally {
      setJoinLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Program not found"}</AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const getTypeColor = (type: Program["type"]) => {
    switch (type) {
      case PROGRAM_TYPES.PUNCH_CARD:
        return "bg-blue-500"
      case PROGRAM_TYPES.POINTS:
        return "bg-green-500"
      case PROGRAM_TYPES.TIERED:
        return "bg-purple-500"
      case PROGRAM_TYPES.COALITION:
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const renderRewardStructure = () => {
    switch (program.type) {
      case PROGRAM_TYPES.PUNCH_CARD:
        return (
          <div className="grid gap-4">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Complete 10 purchases to earn a free reward</p>
          </div>
        )
      case PROGRAM_TYPES.TIERED:
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Points Required</TableHead>
                <TableHead>Benefits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {program.rewards.map((reward, index) => (
                <TableRow key={index}>
                  <TableCell>{reward.description}</TableCell>
                  <TableCell>{reward.threshold}</TableCell>
                  <TableCell>Exclusive rewards and benefits</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      default:
        return (
          <div className="space-y-4">
            {program.rewards.map((reward, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{reward.description}</span>
                <span>{reward.threshold} points</span>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                  <CardDescription className="text-lg">{program.businessName}</CardDescription>
                </div>
                <Badge variant="secondary" className={`${getTypeColor(program.type)} text-white`}>
                  {program.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4 bg-muted">
                {program.nftDesign?.image ? (
                  <img
                    src={program.nftDesign.image || "/placeholder.svg"}
                    alt={program.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">{program.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward Structure</CardTitle>
              <CardDescription>How to earn and redeem rewards</CardDescription>
            </CardHeader>
            <CardContent>{renderRewardStructure()}</CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{program.participants.length.toLocaleString()} participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>{program.rewards_claimed.toLocaleString()} rewards claimed</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span>{program.isOpenEnded ? "Open-ended program" : "Limited-time program"}</span>
              </div>
            </CardContent>
            <CardFooter>
              {walletData?.type === "user" && (
                <Button className="w-full" disabled={isJoined || joinLoading} onClick={handleJoinProgram}>
                  {joinLoading ? "Joining..." : isJoined ? "Already Joined" : "Join Program"}
                  <Gift className="ml-2 h-4 w-4" />
                </Button>
              )}
              {walletData?.type === "merchant" && walletData.publicAddress === program.merchant_address && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/merchant/programs/${program.id}/manage`)}
                >
                  Manage Program
                  <Store className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}