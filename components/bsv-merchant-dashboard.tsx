"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Wallet, BarChart3 } from "lucide-react"
import Link from "next/link"

interface BSVProgram {
  txid: string
  name: string
  description: string
  participants: number
  rewardsClaimed: number
}

export function BSVMerchantDashboard() {
  const [programs, setPrograms] = useState<BSVProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Query BSV blockchain for merchant's programs
    const loadPrograms = async () => {
      try {
        // This would use BSV Rust library to query blockchain
        const merchantAddress = localStorage.getItem("merchantAddress")
        if (!merchantAddress) return

        // Mock data - replace with actual BSV queries
        const bsvPrograms: BSVProgram[] = [
          {
            txid: "abc123",
            name: "Coffee Loyalty",
            description: "Buy 10 get 1 free",
            participants: 25,
            rewardsClaimed: 5,
          },
        ]

        setPrograms(bsvPrograms)
      } catch (error) {
        console.error("Failed to load BSV programs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPrograms()
  }, [])

  const totalParticipants = programs.reduce((sum, p) => sum + p.participants, 0)
  const totalRewards = programs.reduce((sum, p) => sum + p.rewardsClaimed, 0)

  if (isLoading) {
    return <div className="p-8">Loading BSV programs...</div>
  }

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">BSV Merchant Dashboard</h1>
          <p className="text-muted-foreground">Blockchain-powered loyalty programs</p>
        </div>
        <Button asChild>
          <Link href="/merchant/create-program">
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
            <p className="text-xs text-muted-foreground">On BSV blockchain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Verified on-chain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rewards Claimed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRewards}</div>
            <p className="text-xs text-muted-foreground">BSV transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card key={program.txid}>
            <CardHeader>
              <CardTitle className="text-lg">{program.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
              <div className="flex justify-between text-sm">
                <span>{program.participants} participants</span>
                <span>{program.rewardsClaimed} claimed</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">TXID: {program.txid.slice(0, 8)}...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}