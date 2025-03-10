"use client"

import Link from "next/link"
import { Wallet, Ticket, Gift, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletData } from "@/hooks/use-wallet-data"
import type { Program } from "@/types"

// Define an extended program type that includes the participants property
interface ExtendedProgram extends Program {
  participants: string[] // Remove the ? to make it required
}

interface DashboardContentProps {
  programs: Program[]
  isLoading: boolean
  error: string
}

export function DashboardContent({ programs, isLoading, error }: DashboardContentProps) {
  const { walletData } = useWalletData()

  if (isLoading) {
    return <div className="container max-w-7xl mx-auto p-8">Loading programs...</div>
  }

  if (error) {
    return <div className="container max-w-7xl mx-auto p-8">Error loading programs: {error}</div>
  }

  // Cast programs to ExtendedProgram[] to use the participants property
  const participatingPrograms = (programs as ExtendedProgram[]).filter((program) =>
    program.participants?.some((p) => p === walletData?.publicAddress),
  )

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground mt-1">View and manage your loyalty program memberships</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="rounded-sm">
            My Programs
          </TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-sm">
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{participatingPrograms.length}</div>
                <p className="text-xs text-muted-foreground">Programs you're enrolled in</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">0</div>
                <p className="text-xs text-muted-foreground">Across all programs</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Rewards Available</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">0</div>
                <p className="text-xs text-muted-foreground">Ready to claim</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs">
          {participatingPrograms.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-background p-4 mb-4">
                  <Ticket className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Programs</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                  You're not enrolled in any loyalty programs yet. Browse available programs to start earning rewards.
                </p>
                <Button asChild>
                  <Link href="/programs">Browse Programs</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {participatingPrograms.map((program) => (
                <Card key={program.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Link href={`/programs/${program.id}`}>
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Wallet className="h-4 w-4 mr-1" />
                        <span>0 points</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Gift className="h-4 w-4 mr-1" />
                        <span>0 rewards</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="bg-muted/50">
            <CardContent className="py-6">
              <div className="flex flex-col items-center justify-center text-center">
                <Gift className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Rewards Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Soon you'll be able to view and manage all your earned rewards in one place. Keep earning points to
                  unlock exclusive benefits!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}