"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Wallet, Ticket, Gift, BarChart3, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletData } from "@/hooks/use-wallet-data"
import type { Program } from "@/types"

// Add this at the top of the file, after the imports
declare global {
  interface Window {
    _refreshTimeout?: number
  }
}

// Define an extended program type that includes the participants property
interface ExtendedProgram extends Program {
  participants: string[] // Remove the ? to make it required
}

interface ClippedCoupon {
  id: string
  name: string
  description: string
  merchantAddress: string
  clippedAt: string
  expirationDate: string | Date
  discount: string
  status: string
  type: string
  metadata?: any
}

interface DashboardContentProps {
  programs: Program[]
  isLoading: boolean
  error: string
}

export function DashboardContent({ programs, isLoading, error }: DashboardContentProps) {
  const { walletData } = useWalletData()
  const [coupons, setCoupons] = useState<ClippedCoupon[]>([])
  const [loading, setLoading] = useState(true)

  // Use refs to track mounted state and prevent memory leaks
  const isMounted = useRef(true)
  const refreshTimeoutRef = useRef<number | undefined>()
  const storageListenersAdded = useRef(false)

  // Add this optimization to the loadUserData function:
  const loadUserData = useCallback(async () => {
    if (!isMounted.current) return

    if (walletData?.publicAddress) {
      try {
        console.log("Loading user data for:", walletData.publicAddress)

        // Use a more efficient approach with Promise.all for parallel loading
        const userCouponsKey = `user-coupons-${walletData.publicAddress}`
        const userProgramsKey = `user-programs-${walletData.publicAddress}`

        // Load both in parallel
        const [couponsStr] = await Promise.all([
          Promise.resolve(localStorage.getItem(userCouponsKey) || "[]"),
          Promise.resolve(localStorage.getItem(userProgramsKey) || "[]"),
        ])

        // Parse the data
        let userCoupons = []
        try {
          userCoupons = JSON.parse(couponsStr)
        } catch (error) {
          console.error("Error parsing user coupons:", error)
        }

        console.log("Loaded user coupons:", userCoupons.length)

        if (isMounted.current) {
          setCoupons(userCoupons)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        if (isMounted.current) {
          setLoading(false)
        }
      }
    } else {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [walletData])

  // Replace the useEffect that loads user data with this optimized version:
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Only load data if we have wallet data
    if (walletData?.publicAddress) {
      loadUserData()

      // Only add listeners if not already added
      if (!storageListenersAdded.current) {
        storageListenersAdded.current = true

        // Listen for storage updates with debouncing
        const handleStorageUpdate = (event: CustomEvent) => {
          if (!isMounted.current) return

          if (event.detail.userId === walletData.publicAddress) {
            console.log("Storage update event received, refreshing data")
            // Use a debounce approach to prevent multiple rapid refreshes
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
              if (isMounted.current) {
                loadUserData()
              }
              refreshTimeoutRef.current = undefined
            }, 300)
          }
        }

        // Listen for dashboard refresh events with debouncing
        const handleDashboardRefresh = (event: CustomEvent) => {
          if (!isMounted.current) return

          if (event.detail.userId === walletData.publicAddress) {
            console.log("Dashboard refresh event received")
            // Use a debounce approach
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
              if (isMounted.current) {
                loadUserData()
              }
              refreshTimeoutRef.current = undefined
            }, 300)
          }
        }

        window.addEventListener("storageUpdated", handleStorageUpdate as EventListener)
        window.addEventListener("dashboardRefresh", handleDashboardRefresh as EventListener)

        // Also listen for localStorage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
          if (!isMounted.current) return

          if (e.key && e.key.startsWith(`user-coupons-${walletData.publicAddress}`)) {
            console.log("localStorage changed for user coupons, refreshing")

            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
              if (isMounted.current) {
                loadUserData()
              }
              refreshTimeoutRef.current = undefined
            }, 300)
          }
        }

        window.addEventListener("storage", handleStorageChange)
      }
    } else {
      if (isMounted.current) {
        setLoading(false)
      }
    }

    // Cleanup function
    return () => {
      isMounted.current = false

      // Clear any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = undefined
      }
    }
  }, [walletData, loadUserData])

  if (isLoading || loading) {
    return <div className="container max-w-7xl mx-auto p-8">Loading programs...</div>
  }

  if (error) {
    return <div className="container max-w-7xl mx-auto p-8">Error loading programs: {error}</div>
  }

  // Cast programs to ExtendedProgram[] to use the participants property
  const participatingPrograms = (programs as ExtendedProgram[]).filter((program) =>
    program.participants?.some((p) => p === walletData?.publicAddress),
  )

  // Add any programs from localStorage that might not be in the programs prop
  if (walletData?.publicAddress) {
    const userProgramsKey = `user-programs-${walletData.publicAddress}`
    let userPrograms: any[] = []

    try {
      const userProgramsStr = localStorage.getItem(userProgramsKey)
      if (userProgramsStr) {
        userPrograms = JSON.parse(userProgramsStr)
      }
    } catch (error) {
      console.error("Error parsing user programs:", error)
      // Continue with empty array
    }

    if (userPrograms.length > 0) {
      const programIds = participatingPrograms.map((p) => p.id)
      const newPrograms = userPrograms.filter((p: any) => !programIds.includes(p.id))
      if (newPrograms.length > 0) {
        participatingPrograms.push(...newPrograms)
      }
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground mt-1">View and manage your loyalty program memberships</p>
        </div>
        <Button
          onClick={() => {
            loadUserData()
          }}
        >
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="rounded-sm">
            My Programs
          </TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-sm">
            Coupons ({coupons.length})
          </TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-sm">
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
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
                <CardTitle className="text-sm font-medium">Clipped Coupons</CardTitle>
                <Scissors className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{coupons.length}</div>
                <p className="text-xs text-muted-foreground">Coupons ready to use</p>
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

        <TabsContent value="coupons">
          {coupons.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-background p-4 mb-4">
                  <Scissors className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Coupons Clipped</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                  You haven't clipped any coupons yet. Browse available coupons to start saving.
                </p>
                <Button asChild>
                  <Link href="/">Browse Coupons</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{coupon.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{coupon.description}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-primary">{coupon.discount}</span>
                        <span className="text-sm text-muted-foreground">
                          Expires: {new Date(coupon.expirationDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Clipped on: {new Date(coupon.clippedAt).toLocaleDateString()}
                      </div>
                      <Button className="w-full mt-4">Use Coupon</Button>
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