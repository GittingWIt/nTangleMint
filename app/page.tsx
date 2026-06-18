"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Program, PunchCard, ProgramCardDisplay } from "@/lib/types"
import { useWallet } from "@/contexts/wallet-context"
import { getCachedBlockHeight } from "@/lib/services/block-height-service"
import { getProgramsByCreatorOnChain } from "@/lib/services/onchain-state-service"
import { getCreatorPrograms } from "@/lib/services/program-service"
import { getPunchCardByProgramId } from "@/lib/services/storage-service"
import { ProgramCard } from "@/components/program-card"
import { NTangleDialog } from "@/components/punch-card/ntangle-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WalletIcon, Search, Gift, Blocks, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const { wallet } = useWallet()
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [allPublicPrograms, setAllPublicPrograms] = useState<Program[]>([])
  const [programParticipants, setProgramParticipants] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedProgramForJoin, setSelectedProgramForJoin] = useState<Program | null>(null)
  const [isNTangleDialogOpen, setIsNTangleDialogOpen] = useState(false)

  const handleManageProgram = (program: Program) => {
    // Navigate to dashboard to manage the program
    window.location.href = "/dashboard"
  }

  const handleJoinProgram = (program: Program) => {
    if (!wallet?.publicAddress) {
      router.push("/wallet")
      return
    }
    
    setSelectedProgramForJoin(program)
    setIsNTangleDialogOpen(true)
  }

  const handleNTangleSuccess = (newCard: PunchCard) => {
    console.log("[v0] Punch card created successfully, refreshing programs")
    
    // Refresh the programs list to show updated participant counts
    // Re-fetch from on-chain to get latest state
    setLoading(true)
  }

  const handleNTangleClose = () => {
    setIsNTangleDialogOpen(false)
    setSelectedProgramForJoin(null)
  }

  // Load programs from blockchain on component mount
  useEffect(() => {
    setIsHydrated(true)

    const loadPrograms = async () => {
      try {
        const height = await getCachedBlockHeight()
        setCurrentBlockHeight(height)

        // Load ALL active programs from blockchain for Browse section
        const response = await fetch(`/api/external/onchain-state?type=CREATE`)
        if (!response.ok) {
          throw new Error("Failed to fetch programs from blockchain")
        }

        const data = await response.json()
        let allPrograms = data.transactions || []

        // Fetch all Delete transactions to filter out deleted programs
        try {
          const txResponse = await fetch(`/api/external/transactions`)
          if (txResponse.ok) {
            const txData = await txResponse.json()
            const deletedProgramIds = new Set<string>()

            if (Array.isArray(txData.transactions)) {
              // Collect all programIds that have Delete transactions
              for (const tx of txData.transactions) {
                if (tx.type === "Delete" && tx.programId) {
                  deletedProgramIds.add(tx.programId)
                }
              }
            }

            // Filter out deleted programs
            allPrograms = allPrograms.filter((p) => !deletedProgramIds.has(p.id))
          }
        } catch (error) {
          console.warn("[v0] Error fetching deletion status:", error)
        }

        setAllPublicPrograms(allPrograms)

        // For authenticated users: get their specific programs
        if (wallet?.publicAddress) {
          const userPrograms = await getCreatorPrograms(wallet.publicAddress)
          setPrograms(userPrograms)
        } else {
          // Non-authenticated users: show empty for their programs
          setPrograms([])
        }
      } catch (error) {
        console.error("[v0] Failed to load programs:", error)
        setPrograms([])
        setAllPublicPrograms([])
      } finally {
        setLoading(false)
      }
    }

    loadPrograms()
  }, [wallet?.publicAddress])



  const filteredPrograms = programs.filter((p) => {
    // Only show ACTIVE programs on landing page (INACTIVE programs are hidden from customers)
    if (p.status !== "active") return false
    
    // Safely handle undefined properties
    const programName = p.name || ""
    const programDescription = p.description || ""
    
    const matchesSearch =
      programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programDescription.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const programDisplays: ProgramCardDisplay[] = filteredPrograms.map((program) => {
    // Get on-chain participant count from the blockchain
    const participantCount = programParticipants.get(program.id) || 0
    
    // Check if current logged-in customer has JOINED this program
    let isJoined = false
    let punchCard: PunchCard | undefined = undefined
    if (wallet) {
      punchCard = getPunchCardByProgramId(wallet.publicAddress, program.id) ?? undefined
      // Only consider it joined if there are actual punches
      isJoined = punchCard !== undefined && punchCard.punches > 0
    }

    return {
      program,
      merchantName: program.name || "Unknown Merchant",
      participantCount,
      isMinterested: false,
      isJoined,
      punchCard: isJoined ? punchCard : undefined,
      canManage: wallet?.publicAddress === program.creatorAddress,
    }
  })

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary">Powered by BSV Blockchain</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 text-center text-balance">
              Digital Rewards on the Blockchain
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 text-center text-pretty max-w-3xl mx-auto leading-relaxed">
              Create loyalty programs that reward customers instantly. Secure, transparent, and never lost.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {wallet ? (
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/wallet">
                    <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                      Start Earning
                      <WalletIcon className="w-5 h-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose nTangleMint</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience loyalty programs powered by blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Blocks className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Blockchain Secured</h3>
              <p className="text-muted-foreground">
                All transactions are recorded on the BSV blockchain, ensuring transparency and security.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Instant Rewards</h3>
              <p className="text-muted-foreground">
                Digital punch cards awarded instantly with no delays. Customers earn and redeem in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Never Lost</h3>
              <p className="text-muted-foreground">
                No more paper cards. Your loyalty records are permanently stored and always accessible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Programs Section - Show all public programs */}
      {isHydrated && allPublicPrograms.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Browse Programs</h2>
                  <p className="text-muted-foreground">
                    Discover active loyalty programs and earn rewards
                  </p>
                </div>
                
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted border-0 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Programs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPublicPrograms
                .filter((p) => {
                  if (p.status !== "active") return false
                  const programName = p.name || ""
                  const programDescription = p.description || ""
                  return (
                    programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    programDescription.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                })
                .map((program) => {
                  const isOwner = wallet?.publicAddress === program.creatorAddress
                  let punchCard: PunchCard | undefined = undefined
                  let isJoined = false
                  if (wallet) {
                    punchCard = getPunchCardByProgramId(wallet.publicAddress, program.id) ?? undefined
                    isJoined = punchCard !== undefined && punchCard.punches > 0
                  }

                  return (
                    <div key={program.id} className="relative">
                      {isOwner && (
                        <div className="absolute -top-3 -right-3 z-10">
                          <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                            Managed
                          </span>
                        </div>
                      )}
                      <ProgramCard
                        program={program}
                        canManage={isOwner}
                        isJoined={isJoined}
                        punchCard={punchCard}
                        onJoin={() => handleJoinProgram(program)}
                        onManage={() => handleManageProgram(program)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </section>
      )}

      {/* Programs Section - Show user's programs if authenticated */}
      {isHydrated && wallet && filteredPrograms.length > 0 && (
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">nTangleMint Open Programs</h2>
              <p className="text-muted-foreground">
                Explore and join loyalty programs to start earning rewards
              </p>
            </div>

            {/* Programs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programDisplays.map((display) => {
                const isOwner = display.canManage
                
                return (
                  <div key={display.program.id} className="relative">
                    {isOwner && (
                      <div className="absolute -top-3 -right-3 z-10">
                        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                          Your Program
                        </span>
                      </div>
                    )}
                    <ProgramCard
                      program={display.program}
                      canManage={display.canManage}
                      isJoined={display.isJoined}
                      punchCard={display.punchCard}
                      onJoin={() => handleJoinProgram(display.program)}
                      onManage={() => handleManageProgram(display.program)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State & Create CTA */}
      {isHydrated && wallet && filteredPrograms.length === 0 && !loading && (
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">No Active Programs Yet</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create your first loyalty program and start building customer loyalty on the blockchain
              </p>
              
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* nTangle Dialog */}
      {selectedProgramForJoin && wallet?.publicAddress && (
        <NTangleDialog
          program={selectedProgramForJoin}
          isOpen={isNTangleDialogOpen}
          onClose={handleNTangleClose}
          onSuccess={handleNTangleSuccess}
          customerAddress={wallet.publicAddress}
        />
      )}

      {/* CTA Section - Only show if wallet is NOT connected */}
      {!wallet && (
        <section className="py-20 md:py-28 bg-primary/5 border-t border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground mb-10">
                Connect your wallet and join the blockchain loyalty revolution
              </p>
              
              <Link href="/wallet">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  Connect Wallet
                  <WalletIcon className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}