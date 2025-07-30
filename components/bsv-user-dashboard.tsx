"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Ticket, Gift, QrCode, ExternalLink } from "lucide-react"

interface BSVProgram {
  txid: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  merchantAddress: string
  progress: {
    current: number
    required: number
    percentage: number
  }
  joinedAt: string
  status: "active" | "completed" | "expired"
}

interface BSVCoupon {
  txid: string
  name: string
  description: string
  discount: string
  merchantAddress: string
  clippedAt: string
  expirationDate: string
  status: "available" | "used" | "expired"
}

interface BSVReward {
  txid: string
  name: string
  description: string
  programTxid: string
  redeemedAt: string
  value: string
  status: "redeemed" | "pending"
}

interface BSVUserDashboardProps {
  userAddress: string
}

export function BSVUserDashboard({ userAddress }: BSVUserDashboardProps) {
  const [programs, setPrograms] = useState<BSVProgram[]>([])
  const [coupons, setCoupons] = useState<BSVCoupon[]>([])
  const [rewards, setRewards] = useState<BSVReward[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUserData = async (address: string) => {
    try {
      setIsLoading(true)

      console.log(`[BSV READ] Loading user data for: ${address}`)

      // Mock data for development - will be replaced with actual BSV queries
      const mockPrograms: BSVProgram[] = [
        {
          txid: "bsv_program_join_1234567890abcdef",
          name: "Coffee Loyalty Card",
          description: "Buy 10 coffees, get 1 free",
          type: "punch-card",
          merchantAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          progress: { current: 7, required: 10, percentage: 70 },
          joinedAt: "2024-01-15T10:30:00Z",
          status: "active",
        },
      ]

      const mockCoupons: BSVCoupon[] = [
        {
          txid: "bsv_coupon_clip_abcdef1234567890",
          name: "20% Off Pizza",
          description: "Valid on any large pizza",
          discount: "20% OFF",
          merchantAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
          clippedAt: "2024-01-20T14:15:00Z",
          expirationDate: "2024-02-20T23:59:59Z",
          status: "available",
        },
      ]

      const mockRewards: BSVReward[] = [
        {
          txid: "bsv_reward_redeem_fedcba0987654321",
          name: "Free Coffee",
          description: "Redeemed from Coffee Loyalty Card",
          programTxid: "bsv_program_join_1234567890abcdef",
          redeemedAt: "2024-01-10T09:45:00Z",
          value: "$4.50",
          status: "redeemed",
        },
      ]

      setPrograms(mockPrograms)
      setCoupons(mockCoupons)
      setRewards(mockRewards)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userAddress) {
      loadUserData(userAddress)
    }
  }, [userAddress])

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-8">
        <div className="text-center">Loading your BSV data...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BSV User Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Wallet: <code className="bg-muted px-2 py-1 rounded text-sm">{userAddress}</code>
          </p>
        </div>
        <Button onClick={() => loadUserData(userAddress)}>
          <QrCode className="mr-2 h-4 w-4" />
          Scan Program
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="coupons">Coupons ({coupons.length})</TabsTrigger>
          <TabsTrigger value="rewards">Rewards ({rewards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programs.filter((p) => p.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">On BSV blockchain</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Available Coupons</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{coupons.filter((c) => c.status === "available").length}</div>
                <p className="text-xs text-muted-foreground">Ready to use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rewards.length}</div>
                <p className="text-xs text-muted-foreground">Lifetime earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">BSV Transactions</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programs.length + coupons.length + rewards.length}</div>
                <p className="text-xs text-muted-foreground">On blockchain</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card key={program.txid}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{program.description}</p>

                  {program.type === "punch-card" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {program.progress.current}/{program.progress.required}
                        </span>
                      </div>
                      <Progress value={program.progress.percentage} />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      TxID: <code className="bg-muted px-1 rounded">{program.txid.substring(0, 16)}...</code>
                    </div>
                    <div>Joined: {new Date(program.joinedAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coupons">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <Card key={coupon.txid}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{coupon.name}</CardTitle>
                    <Badge variant={coupon.status === "available" ? "default" : "secondary"}>{coupon.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{coupon.discount}</div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      TxID: <code className="bg-muted px-1 rounded">{coupon.txid.substring(0, 16)}...</code>
                    </div>
                    <div>Expires: {new Date(coupon.expirationDate).toLocaleDateString()}</div>
                  </div>

                  {coupon.status === "available" && <Button className="w-full">Use Coupon</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.txid}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <Badge variant={reward.status === "redeemed" ? "default" : "secondary"}>{reward.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{reward.description}</p>

                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{reward.value}</div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      TxID: <code className="bg-muted px-1 rounded">{reward.txid.substring(0, 16)}...</code>
                    </div>
                    <div>Redeemed: {new Date(reward.redeemedAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}