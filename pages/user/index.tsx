'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Gift, Trophy, Users } from 'lucide-react'
import { WalletData } from '@/lib/wallet-types'
import { getWalletData } from '@/lib/wallet-utils'

interface NFTProgram {
  id: number
  name: string
  type: string
  merchant: string
  participants: number
  progress: {
    current: number
    total: number
    description: string
  }
  rewards: {
    earned: number
    available: number
  }
  status: 'Active' | 'Completed' | 'Inactive'
  image: string
}

const programs: NFTProgram[] = [
  {
    id: 1,
    name: "Coffee Lovers",
    type: "Punch Card",
    merchant: "Brew Haven",
    participants: 1500,
    progress: {
      current: 7,
      total: 10,
      description: "7/10 punches"
    },
    rewards: {
      earned: 3,
      available: 1
    },
    status: "Active",
    image: "/placeholder.svg?height=400&width=400"
  },
  {
    id: 2,
    name: "Bookworm Rewards",
    type: "Points",
    merchant: "Page Turner Books",
    participants: 800,
    progress: {
      current: 850,
      total: 1000,
      description: "850/1000 points to next tier"
    },
    rewards: {
      earned: 5,
      available: 2
    },
    status: "Active",
    image: "/placeholder.svg?height=400&width=400"
  },
  {
    id: 3,
    name: "Fitness First",
    type: "Tiered",
    merchant: "Elite Gym",
    participants: 650,
    progress: {
      current: 2,
      total: 4,
      description: "Silver Tier"
    },
    rewards: {
      earned: 1,
      available: 0
    },
    status: "Active",
    image: "/placeholder.svg?height=400&width=400"
  }
]

export default function UserDashboard() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('all')
  const [walletData, setWalletData] = React.useState<WalletData | null>(null)

  React.useEffect(() => {
    const data = getWalletData()
    if (data && data.type === 'user') {
      setWalletData(data)
    } else {
      router.push('/')
    }
  }, [router])

  const filteredPrograms = React.useMemo(() => {
    return programs.filter(program => {
      const searchLower = searchTerm.toLowerCase()
      return (
        program.name.toLowerCase().includes(searchLower) ||
        program.type.toLowerCase().includes(searchLower) ||
        program.merchant.toLowerCase().includes(searchLower)
      )
    }).filter(program => activeTab === 'all' || program.type.toLowerCase().replace(' ', '-') === activeTab.toLowerCase())
  }, [searchTerm, activeTab])

  if (!walletData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your NFT Collection</h1>
          <p className="text-muted-foreground">Manage your loyalty program NFTs</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search programs, merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            All NFTs
          </TabsTrigger>
          <TabsTrigger 
            value="punch-card"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            Punch Cards
          </TabsTrigger>
          <TabsTrigger 
            value="points"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            Points
          </TabsTrigger>
          <TabsTrigger 
            value="tiered"
            className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
          >
            Tiered
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <ScrollArea className="w-full rounded-lg">
            <div className="flex gap-6 pb-4">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="w-[300px] flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle>{program.name}</CardTitle>
                        <CardDescription>{program.merchant}</CardDescription>
                      </div>
                      <Badge 
                        variant={program.status === 'Active' ? 'default' : 'secondary'}
                        className={program.status === 'Active' ? 'bg-slate-900' : ''}
                      >
                        {program.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-slate-100">
                      <img 
                        src={program.image} 
                        alt={program.name}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-white space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{program.progress.description}</span>
                            <span className="text-sm font-medium">
                              {Math.round((program.progress.current / program.progress.total) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(program.progress.current / program.progress.total) * 100} 
                            className="h-2 bg-white/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <Trophy className="w-4 h-4 mx-auto text-slate-600" />
                        <p className="text-sm font-medium">{program.rewards.earned}</p>
                        <p className="text-xs text-muted-foreground">Earned</p>
                      </div>
                      <div className="space-y-1">
                        <Gift className="w-4 h-4 mx-auto text-slate-600" />
                        <p className="text-sm font-medium">{program.rewards.available}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="space-y-1">
                        <Users className="w-4 h-4 mx-auto text-slate-600" />
                        <p className="text-sm font-medium">{program.participants}</p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button 
                      className="w-full bg-slate-900 hover:bg-slate-800"
                      onClick={() => window.open(`https://whatsonchain.com/token/${program.id}`, '_blank')}
                    >
                      View NFT
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}