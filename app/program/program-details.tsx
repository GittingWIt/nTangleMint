"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Users, Trophy, Wallet, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { Program } from "@/types"
import { PROGRAM_TYPES } from "@/lib/constants"

interface ProgramDetailsProps {
  programId: string
}

interface WalletData {
  publicAddress: string
  type: "customer" | "merchant"
  privateKey?: string
  mnemonic?: string
  createdAt: string
  updatedAt: string
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
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Replace with BSV wallet authentication/session management
  // Production-ready wallet data loading function
  const getWalletData = async (): Promise<WalletData | null> => {
    try {
      // TODO: In production, replace with BSV session/authentication
      // const bsvSession = await bsv_rust::get_wallet_session()
      // if (bsvSession) return bsvSession

      // Check bsv-wallet-session first (primary wallet storage)
      const walletStr = localStorage.getItem("bsv-wallet-session")
      if (walletStr) {
        const data = JSON.parse(walletStr)
        return {
          publicAddress: data.address || data.publicAddress,
          type: data.type || "customer",
          privateKey: data.privateKey,
          mnemonic: data.mnemonic,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        }
      }

      // Fallback to devWalletData (development/testing)
      const devWalletStr = localStorage.getItem("devWalletData")
      if (devWalletStr) {
        const data = JSON.parse(devWalletStr)
        return {
          publicAddress: data.publicAddress || data.address,
          type: data.type || "customer",
          privateKey: data.privateKey,
          mnemonic: data.mnemonic,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        }
      }

      console.log("[Wallet] No wallet data found in localStorage")
      return null
    } catch (error) {
      console.error("[Wallet] Error loading wallet data:", error)
      return null
    }
  }

  // TODO: Replace with BSV blockchain API call
  // Load program data from localStorage (production-ready with error handling)
  const loadProgramData = async (id: string): Promise<ExtendedProgram | null> => {
    try {
      // TODO: Replace with BSV API call to get program by ID
      // const bsvProgram = await bsv_rust::get_program_by_id(id)
      // if (bsvProgram) {
      //   return convertBsvProgramToExtended(bsvProgram)
      // }

      // Check global programs first
      const globalPrograms = JSON.parse(localStorage.getItem("globalPrograms") || "[]")
      const foundProgram = globalPrograms.find((p: ExtendedProgram) => p.id === id)

      if (foundProgram) {
        console.log("[Program] Found program in globalPrograms:", foundProgram.name)
        return foundProgram
      }

      // Check merchant-specific programs
      const merchantPrograms = JSON.parse(localStorage.getItem("merchantPrograms") || "[]")
      const merchantProgram = merchantPrograms.find((p: ExtendedProgram) => p.id === id)

      if (merchantProgram) {
        console.log("[Program] Found program in merchantPrograms:", merchantProgram.name)
        return merchantProgram
      }

      console.log("[Program] Program not found:", id)
      return null
    } catch (error) {
      console.error("[Program] Error loading program data:", error)
      return null
    }
  }

  // TODO: Replace with BSV blockchain query
  // Check if user has joined a program
  const checkUserJoinedProgram = async (walletAddress: string, programId: string): Promise<boolean> => {
    try {
      // TODO: Replace with BSV API call to check user participation
      // const isParticipant = await bsv_rust::check_program_participation(programId, walletAddress)
      // return isParticipant

      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${walletAddress}`) || "[]")
      return userPrograms.includes(programId)
    } catch (error) {
      console.error("[Program] Error checking user programs:", error)
      return false
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("[Program Details] Loading data for program:", programId)

        // Load wallet data
        const data = await getWalletData()
        setWalletData(data)

        if (data) {
          console.log("[Program Details] Wallet loaded:", data.publicAddress, data.type)
        } else {
          console.log("[Program Details] No wallet data found")
        }

        // Load program data
        const foundProgram = await loadProgramData(programId)

        if (!foundProgram) {
          setError("Program not found")
          return
        }

        setProgram(foundProgram)
        console.log("[Program Details] Program loaded:", foundProgram.name)

        // Check if user has already joined
        if (data?.type === "customer") {
          const joined = await checkUserJoinedProgram(data.publicAddress, programId)
          setIsJoined(joined)
          console.log("[Program Details] User joined status:", joined)
        }
      } catch (err) {
        console.error("[Program Details] Error loading program:", err)
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

      console.log("[Join Program] Starting join process for:", program.name)

      // TODO: Replace with BSV transaction to join program
      // const joinTxId = await bsv_rust::join_program(program.id, walletData.privateKey)
      // console.log("[Join Program] BSV Transaction ID:", joinTxId)

      // Simulate processing time (remove in production if not needed)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // TODO: Remove localStorage updates when BSV integration is complete
      // Update program participants
      const globalPrograms = JSON.parse(localStorage.getItem("globalPrograms") || "[]")
      const updatedPrograms = globalPrograms.map((p: ExtendedProgram) => {
        if (p.id === program.id) {
          const updatedParticipants = [...p.participants]
          if (!updatedParticipants.includes(walletData.publicAddress)) {
            updatedParticipants.push(walletData.publicAddress)
          }
          return { ...p, participants: updatedParticipants }
        }
        return p
      })
      localStorage.setItem("globalPrograms", JSON.stringify(updatedPrograms))

      // Add to user's programs
      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${walletData.publicAddress}`) || "[]")
      if (!userPrograms.includes(program.id)) {
        userPrograms.push(program.id)
        localStorage.setItem(`userPrograms_${walletData.publicAddress}`, JSON.stringify(userPrograms))
      }

      // Update local state
      setProgram((prev) =>
        prev
          ? {
              ...prev,
              participants: [...prev.participants, walletData.publicAddress],
            }
          : null,
      )
      setIsJoined(true)

      console.log("[Join Program] ✅ Successfully joined program")
    } catch (err) {
      console.error("[Join Program] Error joining program:", err)
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
              {walletData?.type === "customer" && (
                <Button className="w-full" disabled={isJoined || joinLoading} onClick={handleJoinProgram}>
                  {joinLoading ? "Joining..." : isJoined ? "Already Joined" : "Join Program"}
                  <Gift className="ml-2 h-4 w-4" />
                </Button>
              )}
              {walletData?.type === "merchant" && walletData.publicAddress === program.merchant_address && (
                <Button
                  className="w-full bg-transparent"
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