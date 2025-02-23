"use client"

import Link from "next/link"
import { Plus, Users, Wallet, BarChart3, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletData } from "@/hooks/useWalletData"
import type { Program } from "@/types" // Updated import

interface DashboardContentProps {
  programs: Program[]
}

export function DashboardContent({ programs }: DashboardContentProps) {
  const { walletData } = useWalletData() // Updated to destructure walletData

  // Filter programs for this merchant
  const merchantPrograms = programs.filter((program) => program.merchant_address === walletData?.publicAddress)

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your loyalty programs and track customer engagement</p>
        </div>
        <Button asChild>
          <Link href="/merchant/create-program">
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="rounded-sm">
            Programs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-sm">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{merchantPrograms.length}</div>
                <p className="text-xs text-muted-foreground">Active loyalty programs</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {merchantPrograms.reduce((sum, program) => sum + (program.participants?.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all programs</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Rewards Claimed</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {merchantPrograms.reduce((sum, program) => sum + (program.rewards_claimed || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total rewards redeemed</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary opacity-20" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs">
          {merchantPrograms.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-background p-4 mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                  Create your first loyalty program to start engaging with customers and building lasting relationships.
                </p>
                <Button asChild>
                  <Link href="/merchant/create-program">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Program
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {merchantPrograms.map((program) => (
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
                        <Link href={`/merchant/programs/${program.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{program.participants?.length || 0}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        <span>{program.rewards_claimed || 0} claimed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-muted/50">
            <CardContent className="py-6">
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Detailed analytics and insights about your loyalty programs will be available here soon. Track
                  engagement, measure success, and optimize your rewards strategy.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}