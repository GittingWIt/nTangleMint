"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Coffee,
  Tag,
  Users,
  Calendar,
  Gift,
  TrendingUp,
  BarChart3,
  Settings,
  Edit,
  Pause,
  Play,
  Trash2,
  Copy,
  ExternalLink,
  User,
} from "lucide-react"
import Link from "next/link"

interface MerchantProgram {
  id: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  merchantAddress: string
  participants: string[]
  status: "active" | "draft" | "paused"
  metadata: {
    requiredPunches?: number
    totalCoupons?: number
    reward: string
    discountAmount?: string
    merchantName: string
    products?: Array<{ name: string }>
  }
  stats: {
    totalParticipants: number
    rewardsRedeemed: number
    engagementRate: number
    totalRevenue: number
    averageSpend: number
  }
  createdAt: string
  transactionId: string
}

interface ProgramParticipant {
  address: string
  joinedAt: string
  progress: number
  totalPunches?: number
  couponsUsed?: number
  rewardsRedeemed: number
  lastActivity: string
}

interface ProgramTransaction {
  id: string
  type: "customer_joined" | "punch_added" | "coupon_used" | "reward_redeemed"
  customerAddress: string
  timestamp: string
  details: string
}

// Mock BSV transaction queries
const fetchProgramDetails = async (programId: string): Promise<MerchantProgram | null> => {
  try {
    // TODO: Replace with actual BSV blockchain query for program transaction
    console.log(`Fetching program details for ID: ${programId}`)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // TODO: This will query BSV blockchain for the specific program transaction
    // For now, return mock data structure that matches BSV transaction format
    return {
      id: programId,
      name: "Coffee Lover's Rewards",
      description:
        "Earn a free coffee after 10 purchases. Perfect for our regular customers who love their daily brew.",
      type: "punch-card",
      merchantAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      participants: ["1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", "1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX"],
      status: "active",
      metadata: {
        requiredPunches: 10,
        reward: "Free 12oz coffee of your choice",
        merchantName: "One23s Grocery",
        products: [{ name: "Coffee" }, { name: "Espresso" }, { name: "Latte" }],
      },
      stats: {
        totalParticipants: 47,
        rewardsRedeemed: 12,
        engagementRate: 78,
        totalRevenue: 1240.5,
        averageSpend: 26.4,
      },
      createdAt: "2024-01-15T10:30:00Z",
      transactionId: "tx_program_123456789",
    }
  } catch (error) {
    console.error("Error fetching program details:", error)
    return null
  }
}

const fetchProgramParticipants = async (programId: string): Promise<ProgramParticipant[]> => {
  try {
    // TODO: Replace with actual BSV blockchain query for participant transactions
    console.log(`Fetching participants for program: ${programId}`)
    await new Promise((resolve) => setTimeout(resolve, 300))

    // TODO: This will scan BSV transactions for customer interactions with this program
    return [
      {
        address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        joinedAt: "2024-01-16T14:20:00Z",
        progress: 70,
        totalPunches: 7,
        rewardsRedeemed: 0,
        lastActivity: "2024-01-22T09:15:00Z",
      },
      {
        address: "1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX",
        joinedAt: "2024-01-18T11:45:00Z",
        progress: 100,
        totalPunches: 10,
        rewardsRedeemed: 1,
        lastActivity: "2024-01-21T16:30:00Z",
      },
    ]
  } catch (error) {
    console.error("Error fetching program participants:", error)
    return []
  }
}

const fetchProgramTransactions = async (programId: string): Promise<ProgramTransaction[]> => {
  try {
    // TODO: Replace with actual BSV blockchain query for program-related transactions
    console.log(`Fetching transactions for program: ${programId}`)
    await new Promise((resolve) => setTimeout(resolve, 300))

    return [
      {
        id: "tx_001",
        type: "customer_joined",
        customerAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        timestamp: "2024-01-22T09:15:00Z",
        details: "New customer joined the program",
      },
      {
        id: "tx_002",
        type: "punch_added",
        customerAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        timestamp: "2024-01-22T09:16:00Z",
        details: "Punch added for coffee purchase",
      },
    ]
  } catch (error) {
    console.error("Error fetching program transactions:", error)
    return []
  }
}

export default function ProgramDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string

  const [program, setProgram] = useState<MerchantProgram | null>(null)
  const [participants, setParticipants] = useState<ProgramParticipant[]>([])
  const [transactions, setTransactions] = useState<ProgramTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadProgramData = async () => {
      try {
        setIsLoading(true)

        // Fetch all program data from BSV blockchain
        const [programData, participantData, transactionData] = await Promise.all([
          fetchProgramDetails(programId),
          fetchProgramParticipants(programId),
          fetchProgramTransactions(programId),
        ])

        if (!programData) {
          router.push("/merchant")
          return
        }

        setProgram(programData)
        setParticipants(participantData)
        setTransactions(transactionData)
      } catch (error) {
        console.error("Error loading program data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (programId) {
      loadProgramData()
    }
  }, [programId, router])

  const handleCopyProgramId = () => {
    navigator.clipboard.writeText(programId)
    // TODO: Add toast notification
  }

  const handleToggleStatus = async () => {
    if (!program) return

    try {
      // TODO: Create BSV transaction to update program status
      console.log(`Toggling program status from ${program.status}`)

      const newStatus = program.status === "active" ? "paused" : "active"
      setProgram((prev) => (prev ? { ...prev, status: newStatus } : null))
    } catch (error) {
      console.error("Error updating program status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading program details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Program Not Found</h2>
              <p className="text-slate-600 mb-4">The program you're looking for doesn't exist.</p>
              <Button asChild>
                <Link href="/merchant">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    program.type === "punch-card" ? "bg-amber-100" : "bg-green-100"
                  }`}
                >
                  {program.type === "punch-card" ? (
                    <Coffee className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Tag className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{program.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={program.status === "active" ? "default" : "secondary"}
                      className={program.status === "active" ? "bg-green-100 text-green-800" : ""}
                    >
                      {program.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {program.type === "punch-card" ? "Punch Card" : "Coupon Book"}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 max-w-2xl">{program.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyProgramId}>
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleStatus}>
              {program.status === "active" ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{program.stats.totalParticipants}</div>
              <p className="text-xs text-slate-500 mt-1">Active customers</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Rewards Redeemed</CardTitle>
              <Gift className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{program.stats.rewardsRedeemed}</div>
              <p className="text-xs text-slate-500 mt-1">Total claimed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{program.stats.engagementRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Customer engagement</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${program.stats.totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-slate-500 mt-1">Program revenue</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${program.stats.averageSpend.toFixed(0)}</div>
              <p className="text-xs text-slate-500 mt-1">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Program Details */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Program Details</CardTitle>
                    <CardDescription>Configuration and reward information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Program Type</Label>
                        <p className="text-slate-900 capitalize">{program.type.replace("-", " ")}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Status</Label>
                        <p className="text-slate-900 capitalize">{program.status}</p>
                      </div>
                      {program.type === "punch-card" && program.metadata.requiredPunches && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Required Punches</Label>
                          <p className="text-slate-900">{program.metadata.requiredPunches}</p>
                        </div>
                      )}
                      {program.type === "coupon-book" && program.metadata.totalCoupons && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Total Coupons</Label>
                          <p className="text-slate-900">{program.metadata.totalCoupons}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Created</Label>
                        <p className="text-slate-900">{new Date(program.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Transaction ID</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-mono text-sm">
                            {program.transactionId.substring(0, 12)}...
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(program.transactionId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-600">Reward</Label>
                      <p className="text-slate-900">{program.metadata.reward}</p>
                    </div>

                    {program.metadata.products && program.metadata.products.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Applicable Products</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {program.metadata.products.map((product, index) => (
                            <Badge key={index} variant="secondary">
                              {product.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Program
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleToggleStatus}>
                      {program.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Program
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate Program
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on BSV Explorer
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Program
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Program Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Completion Rate</span>
                        <span className="font-medium">
                          {Math.round((program.stats.rewardsRedeemed / program.stats.totalParticipants) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(program.stats.rewardsRedeemed / program.stats.totalParticipants) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Engagement Rate</span>
                        <span className="font-medium">{program.stats.engagementRate}%</span>
                      </div>
                      <Progress value={program.stats.engagementRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Program Participants</CardTitle>
                <CardDescription>Customers enrolled in this loyalty program</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Participants Yet</h3>
                    <p className="text-slate-600">Customers will appear here once they join your program.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <div
                        key={participant.address}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{participant.address.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">
                              {participant.address.substring(0, 8)}...{participant.address.substring(-8)}
                            </p>
                            <p className="text-sm text-slate-600">
                              Joined {new Date(participant.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{participant.progress}%</span>
                            <Progress value={participant.progress} className="w-20 h-2" />
                          </div>
                          <p className="text-xs text-slate-600">
                            {program.type === "punch-card"
                              ? `${participant.totalPunches}/${program.metadata.requiredPunches} punches`
                              : `${participant.couponsUsed} coupons used`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transactions and customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Activity Yet</h3>
                    <p className="text-slate-600">Customer interactions will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "customer_joined"
                              ? "bg-blue-100"
                              : transaction.type === "punch_added"
                                ? "bg-green-100"
                                : transaction.type === "coupon_used"
                                  ? "bg-amber-100"
                                  : "bg-purple-100"
                          }`}
                        >
                          {transaction.type === "customer_joined" && <Users className="h-5 w-5 text-blue-600" />}
                          {transaction.type === "punch_added" && <Coffee className="h-5 w-5 text-green-600" />}
                          {transaction.type === "coupon_used" && <Tag className="h-5 w-5 text-amber-600" />}
                          {transaction.type === "reward_redeemed" && <Gift className="h-5 w-5 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{transaction.details}</p>
                          <p className="text-sm text-slate-600">
                            {transaction.customerAddress.substring(0, 8)}...{transaction.customerAddress.substring(-8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(transaction.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Program Settings</CardTitle>
                <CardDescription>Manage program configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Settings Coming Soon</h3>
                  <p className="text-slate-600">Program management features will be available in the next update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}