'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trophy, Gift, Users, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getWalletData } from '@/lib/wallet-utils'

interface NFT {
  id: string
  programId: string
  name: string
  business: string
  type: 'punch-card' | 'tiered' | 'points' | 'coalition'
  image: string
  progress: {
    current: number
    total: number
    label: string
    percentage: number
  }
  stats: {
    earned: number
    available: number
    members: number
  }
  status: 'active' | 'completed' | 'expired'
}

export default function UserDashboard() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<ReturnType<typeof getWalletData> | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    const data = getWalletData()
    if (!data || data.type !== 'user') {
      router.push('/')
      return
    }
    setWalletData(data)

    // Load user's programs
    const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${data.publicAddress}`) || '[]')
    const globalPrograms = JSON.parse(localStorage.getItem('globalPrograms') || '[]')
    
    // Create NFTs for joined programs
    const userNfts = userPrograms.map(programId => {
      const program = globalPrograms.find(p => p.id === programId)
      if (!program) return null

      // Generate NFT data based on program type
      const nftData: NFT = {
        id: `${program.id}-nft`,
        programId: program.id,
        name: program.name,
        business: program.business,
        type: program.type,
        image: program.image,
        progress: {
          current: 0,
          total: 0,
          label: '',
          percentage: 0
        },
        stats: {
          earned: 0,
          available: program.type === 'punch-card' ? 1 : 2,
          members: program.participants
        },
        status: 'active'
      }

      // Set type-specific progress
      switch (program.type) {
        case 'punch-card':
          nftData.progress = {
            current: 7,
            total: 10,
            label: `${7}/10 punches`,
            percentage: 70
          }
          break
        case 'points':
          nftData.progress = {
            current: 850,
            total: 1000,
            label: '850/1000 points to next tier',
            percentage: 85
          }
          break
        case 'tiered':
          nftData.progress = {
            current: 1,
            total: 2,
            label: 'Silver Tier',
            percentage: 50
          }
          break
        case 'coalition':
          nftData.progress = {
            current: 450,
            total: 500,
            label: '450/500 points',
            percentage: 90
          }
          break
      }

      return nftData
    }).filter(Boolean) as NFT[]

    setNfts(userNfts)
  }, [router])

  const filteredNfts = nfts.filter(nft => {
    const matchesSearch = searchTerm === '' || 
      nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.business.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || nft.type === selectedType
    return matchesSearch && matchesType
  })

  const getProgressColor = (type: NFT['type']) => {
    const colors = {
      'punch-card': 'bg-blue-500',
      'points': 'bg-green-500',
      'tiered': 'bg-purple-500',
      'coalition': 'bg-orange-500'
    }
    return colors[type]
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your NFT Collection</h1>
          <p className="text-muted-foreground">Manage your loyalty program NFTs</p>
        </div>
        <Button asChild>
          <a href="/" className="flex items-center gap-2">
            Find Programs
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs, merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Tabs
          value={selectedType}
          onValueChange={setSelectedType}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="all">All NFTs</TabsTrigger>
            <TabsTrigger value="punch-card">Punch Cards</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="tiered">Tiered</TabsTrigger>
            <TabsTrigger value="coalition">Coalition</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredNfts.map(nft => (
          <Card key={nft.id} className="relative overflow-hidden">
            <Badge 
              variant="secondary" 
              className="absolute right-4 top-4 z-10"
            >
              {nft.status}
            </Badge>
            
            <CardHeader>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4 bg-gradient-to-b from-muted/50 to-muted">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/0" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <CardTitle className="text-xl mb-1">{nft.name}</CardTitle>
                  <CardDescription className="text-sm">{nft.business}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{nft.progress.label}</span>
                  <span>{nft.progress.percentage}%</span>
                </div>
                <Progress 
                  value={nft.progress.percentage} 
                  className={getProgressColor(nft.type)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Trophy className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{nft.stats.earned}</div>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
                <div>
                  <Gift className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{nft.stats.available}</div>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div>
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{nft.stats.members}</div>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full" variant="outline">
                Redeem Rewards
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredNfts.length === 0 && (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>No NFTs Found</CardTitle>
            <CardDescription>
              {searchTerm || selectedType !== 'all' 
                ? "Try adjusting your search or filters"
                : "Join loyalty programs to start collecting NFTs"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <a href="/">Browse Programs</a>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}