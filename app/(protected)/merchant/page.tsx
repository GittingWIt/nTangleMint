"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePrograms } from "@/hooks/use-programs"
import { useWalletData } from "@/hooks/use-wallet-data"
import { MerchantProgramCard } from "./components/merchant-program-card"
import { Search, Plus, Loader2 } from "lucide-react"
import type { Program } from "@/types"

export default function MerchantDashboard() {
  const router = useRouter()
  const { walletData } = useWalletData()
  const { programs, isLoading, error, refresh } = usePrograms({
    autoRefresh: true,
    refreshInterval: 5000,
    ...(walletData?.publicAddress ? { merchantAddress: walletData.publicAddress } : {}),
  })
  const [searchQuery, setSearchQuery] = useState("")

  // Fix the filtering logic to properly handle program description
  const filteredPrograms = programs
    .filter((program): program is Program => program !== undefined)
    .filter((program) => {
      const matchesSearch =
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })

  // Calculate statistics with a more defensive approach
  const stats = {
    totalPrograms: programs.length,
    totalParticipants: programs.reduce((sum, p) => {
      // Use a more defensive approach to access potentially missing properties
      const stats = (p as any).stats
      const participantCount = stats?.participantCount || 0
      return sum + participantCount
    }, 0),
    totalRewards: programs.reduce((sum, p) => {
      // Use a more defensive approach to access potentially missing properties
      const stats = (p as any).stats
      const rewardsRedeemed = stats?.rewardsRedeemed || 0
      return sum + rewardsRedeemed
    }, 0),
  }

  // Update the useEffect in the MerchantDashboard component

  // Add this effect to refresh programs when the component mounts or when programs are updated
  useEffect(() => {
    // Initial refresh
    refresh()

    // Listen for program updates
    const handleProgramsUpdated = () => {
      console.log("programsUpdated event detected in dashboard, refreshing programs")
      refresh()
    }

    window.addEventListener("programsUpdated", handleProgramsUpdated)

    return () => {
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
    }
  }, [refresh])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load programs. Please try refreshing the page.
            <Button variant="outline" className="ml-4" onClick={refresh}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
        <p className="text-muted-foreground">Manage your loyalty programs and view analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalPrograms}
            </div>
            <p className="text-xs text-muted-foreground">Active loyalty programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalParticipants}
            </div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalRewards}
            </div>
            <p className="text-xs text-muted-foreground">Total rewards redeemed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Programs</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => router.push("/merchant/create-program")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-2/3 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="mb-4 text-muted-foreground">
                You haven&apos;t created any programs yet. Get started by creating your first loyalty program.
              </p>
              <Button onClick={() => router.push("/merchant/create-program")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <MerchantProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}