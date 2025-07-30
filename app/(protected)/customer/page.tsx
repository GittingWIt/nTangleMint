"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, CreditCard, Clock, TrendingUp } from "lucide-react"
import { getUserProgramTransactions, type JoinedProgram, type CustomerTransaction } from "@/lib/program-participation"

// Function to get customer's joined programs from localStorage
function getCustomerJoinedPrograms(customerAddress: string): JoinedProgram[] {
  try {
    console.log("🔍 Loading joined programs for customer:", customerAddress)

    const joinedPrograms: JoinedProgram[] = []

    // Get all localStorage keys to find merchant programs
    const keys = Object.keys(localStorage)
    const merchantProgramKeys = keys.filter((key) => key.startsWith("merchant-programs-"))

    console.log("🔍 Found merchant program keys:", merchantProgramKeys)

    // Check each merchant's programs for customer participation
    merchantProgramKeys.forEach((key) => {
      try {
        const merchantPrograms = JSON.parse(localStorage.getItem(key) || "[]")

        merchantPrograms.forEach((program: any) => {
          // Check if customer is in participants array
          if (Array.isArray(program.participants) && program.participants.includes(customerAddress)) {
            const joinedProgram: JoinedProgram = {
              id: program.id,
              name: program.name,
              description: program.description,
              type: program.type,
              merchantAddress: program.merchantAddress,
              participants: program.participants,
              metadata: program.metadata || {}, // Ensure metadata exists
              joinedAt: new Date().toISOString(), // TODO: Track actual join date
              progress: {
                current: 0, // TODO: Track actual progress
                required: program.metadata?.requiredPunches || program.metadata?.totalCoupons || 5,
                percentage: 0,
              },
            }

            joinedPrograms.push(joinedProgram)
            console.log("✅ Found joined program:", program.name)
          }
        })
      } catch (error) {
        console.error(`❌ Error checking programs in ${key}:`, error)
      }
    })

    console.log(`🎯 Customer has joined ${joinedPrograms.length} programs`)
    return joinedPrograms
  } catch (error) {
    console.error("❌ Error loading customer joined programs:", error)
    return []
  }
}

export default function CustomerDashboard() {
  const [joinedPrograms, setJoinedPrograms] = useState<JoinedProgram[]>([])
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [walletData, setWalletData] = useState<{ publicAddress: string; privateKey: string } | null>(null)

  useEffect(() => {
    // Get wallet data from localStorage
    const loadWalletData = () => {
      try {
        // Check bsv-wallet-session first
        const sessionData = localStorage.getItem("bsv-wallet-session")
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          setWalletData({
            publicAddress: parsed.address,
            privateKey: parsed.privateKey || "", // May not be available
          })
          console.log("🔥 Customer wallet loaded from session:", parsed.address)
          return
        }

        // Fallback to devWalletData
        const devData = localStorage.getItem("devWalletData")
        if (devData) {
          const parsed = JSON.parse(devData)
          setWalletData(parsed)
          console.log("🔥 Customer wallet loaded from dev data:", parsed.publicAddress)
          return
        }

        console.log("❌ No wallet data found")
      } catch (error) {
        console.error("Error parsing wallet session:", error)
      }
    }

    loadWalletData()

    // Listen for wallet updates
    const handleWalletUpdate = () => {
      console.log("🔄 Wallet updated, reloading...")
      loadWalletData()
    }

    window.addEventListener("bsvWalletUpdated", handleWalletUpdate)
    return () => window.removeEventListener("bsvWalletUpdated", handleWalletUpdate)
  }, [])

  useEffect(() => {
    if (walletData) {
      fetchCustomerData()
    }
  }, [walletData])

  // Listen for program updates
  useEffect(() => {
    const handleProgramsUpdated = () => {
      console.log("🔄 Programs updated, refreshing customer data...")
      if (walletData) {
        fetchCustomerData()
      }
    }

    const handleStorageChange = () => {
      console.log("🔄 Storage changed, refreshing customer data...")
      if (walletData) {
        fetchCustomerData()
      }
    }

    window.addEventListener("programsUpdated", handleProgramsUpdated)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("programsUpdated", handleProgramsUpdated)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [walletData])

  const fetchCustomerData = async () => {
    if (!walletData) return

    try {
      setLoading(true)
      console.log("🔄 Fetching customer data for:", walletData.publicAddress)

      // TODO: In production, fetch from BSV blockchain
      // For now, get from localStorage
      const programs = getCustomerJoinedPrograms(walletData.publicAddress)
      const transactionHistory = await getUserProgramTransactions(walletData.publicAddress)

      setJoinedPrograms(programs)
      setTransactions(transactionHistory)

      console.log("✅ Customer data loaded:", {
        programs: programs.length,
        transactions: transactionHistory.length,
      })
    } catch (error) {
      console.error("Error fetching customer data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your programs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Wallet Found</h1>
          <p className="text-muted-foreground mb-4">
            Please create or restore a wallet to access the customer dashboard.
          </p>
          <Button onClick={() => (window.location.href = "/wallet-generation")}>Create Wallet</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-muted-foreground">
            Wallet: {walletData.publicAddress.substring(0, 8)}...{walletData.publicAddress.substring(-8)}
          </p>
        </div>
        <Button onClick={fetchCustomerData} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{joinedPrograms.length}</div>
            <p className="text-xs text-muted-foreground">Programs you've joined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Program activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Available</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {joinedPrograms.filter((p) => p.progress && p.progress.percentage >= 100).length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to redeem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {joinedPrograms.filter((p) => !p.progress || p.progress.percentage < 100).length}
            </div>
            <p className="text-xs text-muted-foreground">Programs in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">My Programs</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {joinedPrograms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Programs Joined</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't joined any loyalty programs yet. Start earning rewards by joining merchant programs!
                </p>
                <Button onClick={() => (window.location.href = "/")}>Browse Programs</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <CardDescription>{program.description}</CardDescription>
                      </div>
                      <Badge variant={program.type === "punch-card" ? "default" : "secondary"}>
                        {program.type === "punch-card" ? "Punch Card" : "Coupon Book"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {program.progress && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>
                            {program.progress.current}/{program.progress.required}
                          </span>
                        </div>
                        <Progress value={program.progress.percentage} className="h-2" />
                      </div>
                    )}

                    {/* FIXED: Access rewardDescription from metadata object */}
                    {program.metadata?.rewardDescription && (
                      <div className="text-sm">
                        <span className="font-medium">Reward: </span>
                        <span className="text-muted-foreground">{program.metadata.rewardDescription}</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Joined: {new Date(program.joinedAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      {program.progress && program.progress.percentage >= 100 ? (
                        <Button size="sm" className="flex-1">
                          <Gift className="h-4 w-4 mr-2" />
                          Redeem Reward
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transaction History</h3>
                <p className="text-muted-foreground text-center">
                  Your program activities will appear here once you start participating in loyalty programs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your program transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div>
                          <p className="font-medium">{transaction.details.programName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.type.replace("-", " ")} •{" "}
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {transaction.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}