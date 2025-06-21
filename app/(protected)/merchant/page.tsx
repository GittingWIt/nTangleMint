"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Search, User, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { MerchantProgramCard } from "./components/merchant-program-card"
import { debug } from "@/lib/debug"
import { MerchantProfileEditor } from "@/components/merchant-profile-editor"
import { loadMerchantPrograms } from "@/lib/program-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function MerchantDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("programs")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showDraftPrograms, setShowDraftPrograms] = useState(true)

  // Load programs
  const isFetchingPrograms = useRef(false)
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true)

        if (isFetchingPrograms.current) return
        isFetchingPrograms.current = true

        // Load all merchant programs
        const merchantPrograms = loadMerchantPrograms()
        debug(`Loaded ${merchantPrograms.length} merchant programs`)

        // Include all programs regardless of status
        setPrograms(merchantPrograms)
      } catch (err) {
        console.error("Error loading programs:", err)
        setError("Failed to load programs. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
        isFetchingPrograms.current = false
      }
    }

    fetchPrograms()

    // Listen for program updates
    const handleProgramsUpdated = () => {
      debug("programsUpdated event received, refreshing programs")
      fetchPrograms()
    }

    window.addEventListener("programsUpdated", handleProgramsUpdated)
    return () => {
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
    }
  }, [refreshKey])

  // Filter programs based on search term and draft status
  const filteredPrograms = Array.isArray(programs)
    ? programs.filter(
        (program) =>
          // Filter by search term
          (program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            program.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
          // Only filter out draft programs if showDraftPrograms is false
          (showDraftPrograms || program.status !== "draft"),
      )
    : []

  // Calculate statistics
  const stats = {
    totalPrograms: programs.length,
    totalParticipants: programs.reduce((sum, p) => {
      const participants = Array.isArray(p.participants) ? p.participants.length : 0
      return sum + participants
    }, 0),
    totalRewards: programs.reduce((sum, p) => {
      const stats = p.stats || {}
      const rewardsRedeemed = stats.rewardsRedeemed || 0
      return sum + rewardsRedeemed
    }, 0),
  }

  // No hardcoded merchant profile - keep it simple
  const merchantProfile = null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Simplified control buttons */}
      <div className="mb-4 flex justify-between">
        <div className="flex space-x-2">{/* Keep only essential controls */}</div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDraftPrograms(!showDraftPrograms)}
            variant="outline"
            className="flex items-center"
            size="sm"
          >
            {showDraftPrograms ? "Hide Draft Programs" : "Show Draft Programs"}
          </Button>
          <Button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            variant="outline"
            className="flex items-center"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Direct access - no wallet verification needed */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Merchant Profile
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Merchant Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your loyalty programs and view analytics</p>
            </div>
            <Button asChild>
              <Link href="/merchant/create-program">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Program
              </Link>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-8 grid-cols-1 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
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
              <CardHeader className="pb-2">
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
              <CardHeader className="pb-2">
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

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Your Programs</h2>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
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
          ) : filteredPrograms.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => (
                <MerchantProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold mb-2">You haven't created any programs yet.</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first loyalty program.</p>
              <Button asChild>
                <Link href="/merchant/create-program">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Program
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile">
          <MerchantProfileEditor />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Analytics features coming soon</p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}