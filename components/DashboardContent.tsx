'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trophy, Gift, Users, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createWallet, restoreWallet } from '@/lib/bsv/wallet'
import { programUtils } from '@/lib/program-utils'
import { NFTVisualization } from '@/components/NFTVisualization'
import type { Program, WalletData, NFTDesign } from '@/types'
import type { NFTDesign } from '@/components/NFTVisualization'

interface NFTDisplay {
  programId: string
  programName: string
  merchantName: string
  type: 'punch-card' | 'points' | 'tiered'
  progress: number
  target: number
  nftCount: number
  availableRewards: number
  totalMembers: number
  nftDesign: NFTDesign
}

function getTypeColor(type: NFTDisplay['type']): string {
  switch (type) {
    case 'punch-card': return 'hsl(var(--primary))'
    case 'points': return 'hsl(var(--secondary))'
    case 'tiered': return 'hsl(var(--accent))'
    default: return 'hsl(var(--muted))'
  }
}

function getProgramIcon(type: NFTDisplay['type']): string {
  switch (type) {
    case 'punch-card': return '🎟️'
    case 'points': return '🎯'
    case 'tiered': return '🏆'
    default: return '🎁'
  }
}

export default function DashboardContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState('all')
  const [programs, setPrograms] = React.useState<NFTDisplay[]>([])
  const [walletData, setWalletData] = React.useState<WalletData | null>(null)

  React.useEffect(() => {
    const data = getWalletData()
    setWalletData(data)
    
    if (!data || data.type !== 'user') {
      router.push('/wallet-generation')
      return
    }

    const loadUserData = async () => {
      try {
        setIsLoading(true)
        const allPrograms = programUtils.getAllPrograms()
        const userParticipation = programUtils.getUserParticipation(data.publicAddress)
        
        const participating = allPrograms
          .filter(program => userParticipation.some(p => p.programId === program.id))
          .map(program => {
            const participation = userParticipation.find(p => p.programId === program.id)
            const progress = participation?.points || 0
            const target = program.type === 'punch-card' ? 10 : 
                          program.type === 'points' ? 1000 : 
                          program.pointsPerReward || 100

            return {
              programId: program.id,
              programName: program.name,
              merchantName: program.businessName || 'Unknown Business',
              type: program.type as NFTDisplay['type'],
              progress,
              target,
              nftCount: participation?.rewards_claimed || 0,
              availableRewards: Math.floor(progress / target),
              totalMembers: program.participants?.length || 0,
              nftDesign: program.nftDesign || {
                layers: [
                  {
                    type: 'gradient',
                    content: `linear-gradient(135deg, ${getTypeColor(program.type)} 0%, hsl(var(--secondary)) 100%)`
                  },
                  {
                    type: 'icon',
                    content: getProgramIcon(program.type),
                    opacity: 0.2,
                    blendMode: 'overlay'
                  }
                ],
                aspectRatio: '2:1',
                borderRadius: '0.5rem',
                animation: {
                  type: 'pulse',
                  duration: 2
                }
              }
            }
          })

        setPrograms(participating)
      } catch (error) {
        console.error('Error loading programs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.merchantName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === 'all' || program.type === activeFilter
    return matchesSearch && matchesFilter
  })

  const getProgressLabel = (program: NFTDisplay) => {
    switch (program.type) {
      case 'punch-card':
        return `${program.progress}/${program.target} punches`
      case 'points':
        return `${program.progress}/${program.target} points to next tier`
      case 'tiered':
        const tier = program.progress >= 1000 ? 'Gold' :
                    program.progress >= 500 ? 'Silver' : 'Bronze'
        return `${tier} Tier`
      default:
        return `${program.progress} points`
    }
  }

  if (!walletData) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your NFT Collection</h1>
        <p className="text-muted-foreground">
          Manage your loyalty program NFTs
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs, merchants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full max-w-xl"
        />
      </div>

      <Tabs defaultValue="all" value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All NFTs</TabsTrigger>
          <TabsTrigger value="punch-card">Punch Cards</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="tiered">Tiered</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardHeader>
                    <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No programs found. Try adjusting your search or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPrograms.map((program) => (
                <Card key={program.programId} className="overflow-hidden group">
                  <NFTVisualization design={program.nftDesign} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{program.programName}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription>{program.merchantName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{getProgressLabel(program)}</span>
                        <span>{Math.round((program.progress / program.target) * 100)}%</span>
                      </div>
                      <Progress value={(program.progress / program.target) * 100} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <Trophy className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-xl font-bold">{program.nftCount}</p>
                        <p className="text-xs text-muted-foreground">Earned</p>
                      </div>
                      <div className="space-y-1">
                        <Gift className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-xl font-bold">{program.availableRewards}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="space-y-1">
                        <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-xl font-bold">{program.totalMembers}</p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full group" variant="outline">
                      View NFT
                      <ArrowUpRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}