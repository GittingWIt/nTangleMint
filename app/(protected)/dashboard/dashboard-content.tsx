'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Program, PunchCard } from '@/lib/types'
import { useWallet } from '@/contexts/wallet-context'
import { useWalletRedirect } from '@/hooks/useWalletRedirect'
import { useTransactionHistory, formatTransactionType, formatTransactionAmount, getTransactionColor } from '@/hooks/useTransactionHistory'
import { getCurrentWallet, refreshWalletBalance, getPrivKeyWif, getStoredPassword, getStoredMnemonic } from '@/lib/services/wallet-service'
import { getProgramsByMerchant, getProgramById, activateProgram } from '@/lib/services/program-service'
import { getActivePunchCards, getCompletedPunchCards } from '@/lib/services/punchcard-service'
import { getCachedBlockHeight } from '@/lib/services/block-height-service'
import { getAddressBalance } from '@/lib/services/bsv-service'
import { getParticipantCountOnChain } from '@/lib/services/onchain-state-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, RefreshCw, Loader2, Zap, Package, Unlock, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Loading from '@/components/loading'
import Link from 'next/link'

type TabType = 'dashboard' | 'programs' | 'cards'

export default function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { wallet, setWallet } = useWallet()
  
  // Tab from URL or default to dashboard
  const tabParam = searchParams?.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'dashboard')

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)
  const [bsvBalance, setBsvBalance] = useState(0)
  const [showAddressDiagnostics, setShowAddressDiagnostics] = useState(false)
  
  // Creator data
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [programParticipants, setProgramParticipants] = useState<Map<string, number>>(new Map())
  const [activatingProgramId, setActivatingProgramId] = useState<string | null>(null)
  const [activationError, setActivationError] = useState<string | null>(null)
  
  // User data
  const [activePunchCards, setActivePunchCards] = useState<PunchCard[]>([])
  const [completedPunchCards, setCompletedPunchCards] = useState<PunchCard[]>([])
  
  // Transaction history
  const { transactions, isLoading: transactionsLoading } = useTransactionHistory(wallet?.publicAddress || null)

  // Use wallet redirect hook - redirects to wallet if no wallet exists
  useWalletRedirect({
    redirectToWalletWhenExists: false
  })

  // Load all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      if (!wallet) return

      try {
        setIsLoading(true)

        // Fetch block height and balance
        const [blockHeight, balanceData] = await Promise.all([
          getCachedBlockHeight(),
          getAddressBalance(wallet.publicAddress)
        ])
        
        setCurrentBlockHeight(blockHeight)
        setBsvBalance(balanceData.total)

        // Load creator programs
        const merchantPrograms = getProgramsByMerchant(wallet.publicAddress)
        setMyPrograms(merchantPrograms)

        // Fetch participant counts for creator programs
        const participantCounts = new Map<string, number>()
        for (const program of merchantPrograms) {
          try {
            const count = await getParticipantCountOnChain(program.id)
            participantCounts.set(program.id, count)
          } catch (error) {
            console.error(`[v0] Failed to fetch participants for program ${program.id}:`, error)
            participantCounts.set(program.id, 0)
          }
        }
        setProgramParticipants(participantCounts)

        // Load punch cards
        const active = getActivePunchCards(wallet.publicAddress)
        const completed = getCompletedPunchCards(wallet.publicAddress)
        const actualActiveCards = active.filter(card => card.punches > 0)

        setActivePunchCards(actualActiveCards)
        setCompletedPunchCards(completed)

      } catch (error) {
        console.error('[v0] Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [wallet])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      if (wallet) {
        const updatedWallet = await refreshWalletBalance(wallet)
        setWallet(updatedWallet)
        setBsvBalance(updatedWallet.balance?.total || 0)
      }
    } catch (error) {
      console.error('[v0] Error refreshing wallet balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateProgram = async (program: Program) => {
    try {
      setActivatingProgramId(program.id)
      setActivationError(null)

      if (!wallet) {
        setActivationError('Wallet not connected')
        return
      }

      // Get mnemonic and password from session storage (stored during wallet setup)
      const mnemonic = getStoredMnemonic()
      const password = getStoredPassword()

      if (!mnemonic) {
        setActivationError('Wallet mnemonic not found. Please restore your wallet.')
        return
      }

      // Derive private key from mnemonic
      const privKeyWif = getPrivKeyWif(mnemonic, password)

      if (!privKeyWif) {
        setActivationError('Unable to derive private key from wallet')
        return
      }

      // Activate the program (broadcasts to blockchain)
      const result = await activateProgram(
        program.id,
        wallet.publicAddress,
        privKeyWif
      )

      if (result.success) {
        console.log('[v0] Program activated successfully:', program.id)
        // Reload programs to reflect the activation
        const updatedPrograms = getProgramsByMerchant(wallet.publicAddress)
        setMyPrograms(updatedPrograms)
      } else {
        setActivationError(result.error || 'Failed to activate program')
      }
    } catch (error) {
      console.error('[v0] Error activating program:', error)
      setActivationError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setActivatingProgramId(null)
    }
  }

  // Split programs into inactive and active
  const inactivePrograms = myPrograms.filter(p => p.status === 'inactive')
  const activePrograms = myPrograms.filter(p => p.status === 'active')

  if (!wallet) {
    return <Loading />
  }

  return (
    <div className="ml-64 flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your programs and rewards</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              {isLoading ? 'Refreshing' : 'Refresh'}
            </Button>
          </div>

          {/* Wallet Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddressDiagnostics(!showAddressDiagnostics)}
                className="text-xs"
              >
                {showAddressDiagnostics ? 'Hide' : 'Debug'} Address
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(bsvBalance / 100000000).toFixed(8)} BSV</div>
              <p className="text-xs text-muted-foreground mt-2">Block Height: {currentBlockHeight}</p>
              
              {showAddressDiagnostics && wallet && (
                <div className="mt-6 p-4 bg-slate-900 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Wallet Address (Context)</p>
                    <p className="text-xs font-mono text-slate-100 break-all">{wallet.publicAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Faucet Address</p>
                    <p className="text-xs font-mono text-slate-100 break-all">n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Match Status</p>
                    {wallet.publicAddress === 'n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg' ? (
                      <p className="text-xs text-green-400 font-medium">✓ ADDRESSES MATCH</p>
                    ) : (
                      <p className="text-xs text-red-400 font-medium">✗ ADDRESSES DO NOT MATCH</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Punch Cards</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Creator Programs Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">My Programs</CardTitle>
                    <CardDescription>Programs you&apos;ve created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myPrograms.length}</div>
                    <Link href="/dashboard?tab=programs">
                      <Button variant="link" size="sm" className="mt-2 p-0 h-auto">
                        View Programs →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* User Rewards Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Punch Cards</CardTitle>
                    <CardDescription>Programs you&apos;ve joined</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activePunchCards.length + completedPunchCards.length}</div>
                    <Link href="/dashboard?tab=cards">
                      <Button variant="link" size="sm" className="mt-2 p-0 h-auto">
                        View Cards →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Your recent blockchain transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactionsLoading ? (
                      <div className="text-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading transactions...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-6">
                        <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No transaction history yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Your transactions will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {transactions.slice(0, 10).map((tx) => (
                          <div key={tx.txId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{formatTransactionType(tx.type)}</p>
                                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  {tx.status === "confirmed" ? "✓" : "◐"} {tx.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {tx.programName && <span>{tx.programName} · </span>}
                                {new Date(tx.timestamp * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            <div className={cn("text-right text-sm font-mono", getTransactionColor(tx.type))}>
                              {formatTransactionAmount(tx.amount, tx.type)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/create-program/punch-card">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Program
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">My Programs</h2>
                  <p className="text-sm text-muted-foreground">Programs you&apos;ve created</p>
                </div>
                <Link href="/create-program/punch-card">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Program
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myPrograms.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No programs yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first loyalty program</p>
                    <Link href="/create-program/punch-card">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Program
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {activationError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{activationError}</p>
                    </div>
                  )}

                  {/* Inactive Programs Section */}
                  {inactivePrograms.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Inactive Programs</h3>
                        <p className="text-sm text-muted-foreground mb-4">Click Activate to broadcast your program to the blockchain</p>
                      </div>
                      <div className="grid gap-4">
                        {inactivePrograms.map((program) => (
                          <Card key={program.id} className="border-yellow-200 bg-yellow-50">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle>{program.name}</CardTitle>
                                  <CardDescription>{program.id}</CardDescription>
                                </div>
                                <Button
                                  onClick={() => handleActivateProgram(program)}
                                  disabled={activatingProgramId === program.id}
                                  size="sm"
                                  className="gap-2"
                                >
                                  {activatingProgramId === program.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Activating...
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="font-medium capitalize">{program.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="font-medium capitalize text-yellow-700">{program.status}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Participants:</span>
                                  <span className="font-medium">{programParticipants.get(program.id) || 0}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Programs Section */}
                  {activePrograms.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Active Programs</h3>
                        <p className="text-sm text-muted-foreground mb-4">Your programs are live and customers can join</p>
                      </div>
                      <div className="grid gap-4">
                        {activePrograms.map((program) => (
                          <Card key={program.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle>{program.name}</CardTitle>
                                  <CardDescription>{program.id}</CardDescription>
                                </div>
                                <Link href={`/programs/${program.id}`}>
                                  <Button variant="outline" size="sm">
                                    Manage
                                  </Button>
                                </Link>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="font-medium capitalize">{program.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="font-medium capitalize text-green-700">{program.status}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Participants:</span>
                                  <span className="font-medium">{programParticipants.get(program.id) || 0}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Punch Cards Tab */}
            <TabsContent value="cards" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">My Punch Cards</h2>
                <p className="text-sm text-muted-foreground">Programs you&apos;ve joined and rewards you&apos;re earning</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activePunchCards.length === 0 && completedPunchCards.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No punch cards yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Join a program to start earning rewards</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Active Cards */}
                  {activePunchCards.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Active Cards</h3>
                      <div className="grid gap-3">
                        {activePunchCards.map((card) => {
                          const program = getProgramById(card.programId)
                          return (
                            <Card key={card.txId}>
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{program?.name || card.programId}</CardTitle>
                                    <CardDescription className="text-xs">{card.punches} / {card.requiredPunches} punches</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Cards */}
                  {completedPunchCards.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Completed Cards</h3>
                      <div className="grid gap-3">
                        {completedPunchCards.map((card) => {
                          const program = getProgramById(card.programId)
                          return (
                            <Card key={card.txId} className="opacity-70">
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-base">{program?.name || card.programId}</CardTitle>
                                    <CardDescription className="text-xs">Completed</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}