'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Program, PunchCard } from '@/lib/types'
import { useWallet } from '@/contexts/wallet-context'
import { useWalletRedirect } from '@/hooks/useWalletRedirect'
import { refreshWalletBalance } from '@/lib/services/wallet-service'
import { getCreatorPrograms } from '@/lib/services/program-service'
import { getActivePunchCards, getCompletedPunchCards } from '@/lib/services/punchcard-service'
import { getCachedBlockHeight } from '@/lib/services/block-height-service'
import { getAddressBalance } from '@/lib/services/bsv-service'
import { getProgramParticipantCountOnChain } from '@/lib/services/onchain-state-service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import Loading from '@/components/loading'
import Link from 'next/link'

// Import modularized sections
import { MyProgramsSection } from './sections/my-programs-section'
import { WalletStatsSection } from './sections/wallet-stats-section'
import { PunchCardsSection } from './sections/punch-cards-section'
import { RecentActivitySection } from './sections/recent-activity-section'

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
  
  // Creator data
  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [programParticipants, setProgramParticipants] = useState<Map<string, number>>(new Map())
  
  // User data
  const [activePunchCards, setActivePunchCards] = useState<PunchCard[]>([])
  const [completedPunchCards, setCompletedPunchCards] = useState<PunchCard[]>([])

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

        // Load creator programs from blockchain (uses creatorAddress)
        const merchantPrograms = await getCreatorPrograms(wallet.publicAddress)
        setMyPrograms(merchantPrograms)

        // Fetch participant counts for creator programs
        const participantCounts = new Map<string, number>()
        for (const program of merchantPrograms) {
          try {
            const count = await getProgramParticipantCountOnChain(program.id)
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

  // Handle refresh
  const handleRefresh = async () => {
    if (!wallet) return
    try {
      const updatedWallet = await refreshWalletBalance(wallet)
      setWallet(updatedWallet)
      
      // Reload all data
      const [blockHeight, balanceData] = await Promise.all([
        getCachedBlockHeight(),
        getAddressBalance(updatedWallet.publicAddress)
      ])
      
      setCurrentBlockHeight(blockHeight)
      setBsvBalance(balanceData.total)
    } catch (error) {
      console.error('[v0] Error refreshing wallet:', error)
    }
  }

  // Handle programs updated (after draft activation)
  const handleProgramsUpdated = async () => {
    if (!wallet) return
    try {
      const merchantPrograms = await getCreatorPrograms(wallet.publicAddress)
      setMyPrograms(merchantPrograms)
    } catch (error) {
      console.error('[v0] Error refreshing programs:', error)
    }
  }

  if (isLoading) {
    return <Loading text="Loading dashboard..." />
  }

  if (!wallet) {
    return <div className="text-center py-8">No wallet found. Please create or import a wallet first.</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
        {/* Header with tabs and create button */}
        <div className="flex items-center justify-between gap-4">
          <TabsList className="grid w-max grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="cards">Punch Cards</TabsTrigger>
          </TabsList>
          
          <Link href="/create-program/punch-card">
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Create Program
            </button>
          </Link>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <WalletStatsSection
            balance={bsvBalance}
            blockHeight={currentBlockHeight}
            wallet={wallet}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
          <RecentActivitySection
            address={wallet?.publicAddress || null}
          />
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <MyProgramsSection
            programs={myPrograms}
            blockHeight={currentBlockHeight}
            wallet={wallet}
            isLoading={isLoading}
            onProgramsUpdated={handleProgramsUpdated}
          />
        </TabsContent>

        {/* Punch Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <PunchCardsSection
            activePunchCards={activePunchCards}
            completedPunchCards={completedPunchCards}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}