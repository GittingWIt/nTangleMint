"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Tag, Coffee, Store, Gift, Trophy } from "lucide-react"
import { debug } from "@/lib/debug"

interface WalletData {
  publicAddress: string
  type: "customer" | "merchant"
  businessName?: string
}

interface Program {
  id: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  merchantAddress: string
  participants: string[]
  metadata?: {
    requiredPunches?: number
    totalCoupons?: number
    reward?: string
    discountAmount?: string
    merchantName?: string
    products?: Array<{ name: string }>
  }
}

interface JoinedProgram extends Program {
  joinedAt?: string
  progress?: {
    current: number
    required: number
    percentage: number
  }
}

interface CustomerTransaction {
  id: string
  type: "join" | "leave" | "progress" | "reward"
  programName: string
  timestamp: string
}

// Simple localStorage helpers
const getStorageItem = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch (e) {
    console.error("Error accessing localStorage:", e)
    return null
  }
}

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.error("Error setting localStorage:", e)
  }
}

// Simple data access functions
const getWalletData = (): WalletData | null => {
  try {
    const walletStr = getStorageItem("walletData")
    if (!walletStr) return null
    return JSON.parse(walletStr)
  } catch (error) {
    console.error("Error getting wallet data:", error)
    return null
  }
}

const getPrograms = (): Program[] => {
  try {
    const programsStr = getStorageItem("programs")
    if (!programsStr) return []
    return JSON.parse(programsStr)
  } catch (error) {
    console.error("Error getting programs:", error)
    return []
  }
}

const getUserJoinedPrograms = (userAddress: string): Program[] => {
  try {
    const allPrograms = getPrograms()
    return allPrograms.filter(
      (program) =>
        program.participants && Array.isArray(program.participants) && program.participants.includes(userAddress),
    )
  } catch (error) {
    console.error("Error getting user joined programs:", error)
    return []
  }
}

const getCustomerTransactions = (userAddress: string): CustomerTransaction[] => {
  try {
    const transactionsStr = getStorageItem(`customer_transactions_${userAddress}`)
    if (!transactionsStr) return []
    return JSON.parse(transactionsStr)
  } catch (error) {
    console.error("Error getting customer transactions:", error)
    return []
  }
}

export default function UserPage() {
  const [mounted, setMounted] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [joinedPrograms, setJoinedPrograms] = useState<JoinedProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [programTransactions, setProgramTransactions] = useState<CustomerTransaction[]>([])

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)

      if (!mounted) return

      const wallet = getWalletData()
      if (!wallet) {
        debug("No wallet data found")
        setIsLoading(false)
        return
      }

      // Ensure wallet has proper type
      const validatedWallet: WalletData = {
        ...wallet,
        type: wallet.type === "customer" || wallet.type === "merchant" ? wallet.type : "customer",
      }

      setWalletData(validatedWallet)
      debug(`Loading programs for user: ${validatedWallet.publicAddress}`)

      // Get user's joined programs
      const userPrograms = getUserJoinedPrograms(validatedWallet.publicAddress)
      debug(`User has joined ${userPrograms.length} programs`)

      // Add progress information
      const programsWithProgress = userPrograms.map((program) => {
        const progress = calculateProgress(program, validatedWallet.publicAddress)
        return {
          ...program,
          progress,
          joinedAt: new Date().toISOString(),
        }
      })

      setJoinedPrograms(programsWithProgress)

      // Get customer transactions
      const transactions = getCustomerTransactions(validatedWallet.publicAddress)
      setProgramTransactions(transactions)
      debug(`User has ${transactions.length} program transactions`)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProgress = (program: Program, userAddress: string) => {
    // Get actual progress from storage or default to 0
    const progressKey = `user_progress_${userAddress}_${program.id}`

    try {
      const storedProgress = getStorageItem(progressKey)
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress)
        debug(`Found stored progress for ${program.id}:`, parsed)
        return parsed
      }
    } catch (error) {
      debug("Error loading stored progress:", error)
    }

    // Default to 0 progress for new programs
    let defaultProgress
    if (program.type === "punch-card") {
      const required = program.metadata?.requiredPunches || 10
      defaultProgress = {
        current: 0,
        required,
        percentage: 0,
      }
    } else if (program.type === "coupon-book") {
      const totalCoupons = program.metadata?.totalCoupons || 5
      defaultProgress = {
        current: 0,
        required: totalCoupons,
        percentage: 0,
      }
    } else {
      defaultProgress = { current: 0, required: 1, percentage: 0 }
    }

    // Store the default progress
    try {
      setStorageItem(progressKey, JSON.stringify(defaultProgress))
      debug(`Stored default progress for ${program.id}:`, defaultProgress)
    } catch (error) {
      debug("Error storing default progress:", error)
    }

    return defaultProgress
  }

  const refreshData = () => {
    loadUserData()
  }

  useEffect(() => {
    if (mounted) {
      loadUserData()
    }
  }, [mounted])

  // Show nothing during SSR
  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-muted-foreground">View and manage your loyalty program memberships</p>
          {walletData && (
            <p className="text-sm text-gray-500 mt-1">
              Wallet: {walletData.publicAddress.substring(0, 8)}...{walletData.publicAddress.substring(-8)}
            </p>
          )}
        </div>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{joinedPrograms.length}</div>
            <p className="text-xs text-muted-foreground">Programs you're enrolled in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {joinedPrograms.reduce((acc, program) => acc + (program.progress?.current || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Points/punches earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {joinedPrograms.length > 0
                ? Math.round(
                    joinedPrograms.reduce((acc, p) => acc + (p.progress?.percentage || 0), 0) / joinedPrograms.length,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Average progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Joined Programs */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Programs</h2>

        {joinedPrograms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Programs Joined Yet</h3>
              <p className="text-muted-foreground text-center mb-4">You haven't joined any loyalty programs yet.</p>
              <Button onClick={() => (window.location.href = "/")}>Browse Programs</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {joinedPrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {program.type === "punch-card" ? (
                        <Coffee className="h-6 w-6 text-amber-600" />
                      ) : (
                        <Tag className="h-6 w-6 text-green-600" />
                      )}
                      <div>
                        <CardTitle className="text-xl">{program.name}</CardTitle>
                        <CardDescription>{program.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      <span>Store: {program.metadata?.merchantName || "Local Business"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined: {new Date(program.joinedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  {program.progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {program.type === "punch-card" ? "Punches" : "Coupons Used"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {program.progress.current} / {program.progress.required}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            program.type === "punch-card" ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${program.progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {program.progress.percentage}% complete
                        {program.progress.current >= program.progress.required && " - Reward available!"}
                      </p>
                    </div>
                  )}

                  {/* Program Details */}
                  <div className={`p-3 rounded-lg ${program.type === "punch-card" ? "bg-amber-50" : "bg-green-50"}`}>
                    {program.type === "punch-card" ? (
                      <div className="space-y-1">
                        <p className="font-medium text-amber-800">Reward: {program.metadata?.reward || "Free item"}</p>
                        <p className="text-sm text-amber-700">
                          Get {program.metadata?.requiredPunches || 10} punches to earn your reward
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-green-800">Discount: {program.metadata?.discountAmount}% off</p>
                        <p className="text-sm text-green-700">
                          Valid on: {program.metadata?.products?.[0]?.name || "Selected items"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-semibold">Transaction History</h2>

        {programTransactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No program transactions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {programTransactions.slice(0, 10).map((transaction) => (
              <Card key={transaction.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {transaction.type === "join" && <Users className="h-4 w-4 text-green-600" />}
                    {transaction.type === "leave" && <Users className="h-4 w-4 text-red-600" />}
                    {transaction.type === "progress" && <Trophy className="h-4 w-4 text-blue-600" />}
                    {transaction.type === "reward" && <Gift className="h-4 w-4 text-amber-600" />}
                    <div>
                      <p className="font-medium">
                        {transaction.type === "join" && "Joined Program"}
                        {transaction.type === "leave" && "Left Program"}
                        {transaction.type === "progress" && "Progress Update"}
                        {transaction.type === "reward" && "Reward Earned"}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.programName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}