import { useState, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink } from 'lucide-react'

type Business = {
  name: string;
  sector: string;
  visits?: number;
  purchases?: number;
}

type NFT = {
  id: number;
  type: 'Punch Card' | 'Coalition' | 'Tiered' | 'Local';
  name: string;
  merchant?: string;
  punches?: number;
  totalPunches?: number;
  merchants?: string[];
  points?: number;
  tier?: string;
  nextTier?: string;
  nextTierPoints?: number;
  businesses?: Business[];
  totalPoints?: number;
  design: string;
}

type Activity = {
  id: number;
  date: string;
  program: string;
  activity: string;
  reward: string;
  txHash: string; // Added txHash for transaction viewing
}

const nfts: NFT[] = [
  { id: 1, type: 'Punch Card', name: 'Coffee Lovers', merchant: 'Local Brew', punches: 4, totalPunches: 10, design: 'coffee-beans' },
  { id: 2, type: 'Punch Card', name: 'Sandwich Master', merchant: 'Deli Delights', punches: 7, totalPunches: 8, design: 'sandwich' },
  { id: 3, type: 'Coalition', name: 'Downtown Shoppers', merchants: ['Main St. Goods', 'City Center Mall', 'Local Artisans'], points: 750, design: 'cityscape' },
  { id: 4, type: 'Coalition', name: 'Foodie Favorites', merchants: ['Taste of Italy', 'Sushi Supreme', 'Burger Bonanza'], points: 500, design: 'cutlery' },
  { id: 5, type: 'Tiered', name: 'Bookworm Rewards', merchant: 'City Books', tier: 'Silver', points: 80, nextTier: 'Gold', nextTierPoints: 100, design: 'book' },
  { id: 6, type: 'Tiered', name: 'Fitness Fanatic', merchant: 'GymZone', tier: 'Bronze', points: 50, nextTier: 'Silver', nextTierPoints: 75, design: 'dumbbell' },
  { id: 7, type: 'Local', name: 'Main Street Collective', businesses: [
    { name: 'Corner Cafe', sector: 'Food & Beverage', visits: 10 },
    { name: 'Bookworm\'s Haven', sector: 'Retail', purchases: 3 },
    { name: 'Green Thumb Nursery', sector: 'Garden', visits: 5 },
    { name: 'Tech Repair Shop', sector: 'Services', purchases: 2 }
  ], totalPoints: 200, design: 'main-street' },
  { id: 8, type: 'Local', name: 'Riverside District', businesses: [
    { name: 'Riverside Gym', sector: 'Fitness', visits: 15 },
    { name: 'Organic Market', sector: 'Grocery', purchases: 8 },
    { name: 'Art Supply Co.', sector: 'Retail', purchases: 4 },
    { name: 'Riverbank Cafe', sector: 'Food & Beverage', visits: 12 }
  ], totalPoints: 350, design: 'riverside' },
]

const recentActivity: Activity[] = [
  { id: 1, date: '2024-03-07', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '96c7214c20c786a0e4b1de31f3946a0d5f3b4f33d5c2089f47def84d88bfb31f' },
  { id: 2, date: '2024-03-05', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '7d2a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a' },
  { id: 3, date: '2024-03-03', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '2b1d4a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d' },
  { id: 4, date: '2024-03-01', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f2b' },
  { id: 5, date: '2024-03-07', program: 'Sandwich Master', activity: 'Purchase', reward: '1 punch', txHash: '8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f2b1d4a6c8e4f1b3d5a9c8e7f' },
  // ... (other activity items with txHash added)
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const filteredNFTs = useMemo(() => {
    return nfts.filter(nft => {
      const searchLower = searchTerm.toLowerCase()
      return (
        nft.name.toLowerCase().includes(searchLower) ||
        nft.type.toLowerCase().includes(searchLower) ||
        nft.merchant?.toLowerCase().includes(searchLower) ||
        nft.tier?.toLowerCase().includes(searchLower) ||
        nft.merchants?.some(m => m.toLowerCase().includes(searchLower)) ||
        nft.businesses?.some(b => 
          b.name.toLowerCase().includes(searchLower) || 
          b.sector.toLowerCase().includes(searchLower)
        ) ||
        (nft.type === 'Punch Card' && 'punch card'.includes(searchLower)) ||
        (nft.type === 'Tiered' && nft.tier?.toLowerCase().includes(searchLower))
      )
    }).filter(nft => activeTab === 'all' || nft.type.toLowerCase().replace(' ', '-') === activeTab)
  }, [searchTerm, activeTab])

  const filteredActivity = selectedNFT
    ? recentActivity.filter(activity => activity.program === selectedNFT.name)
    : recentActivity

  const renderNFT = (nft: NFT) => {
    let content: JSX.Element
    switch (nft.type) {
      case 'Punch Card':
        content = (
          <>
            <div className="text-lg font-semibold">{nft.name}</div>
            <div>{nft.merchant}</div>
            <div className="mt-2 flex space-x-1">
              {Array.from({ length: nft.totalPunches || 0 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full ${i < (nft.punches || 0) ? 'bg-primary' : 'bg-gray-300'}`} />
              ))}
            </div>
          </>
        )
        break
      case 'Coalition':
        content = (
          <>
            <div className="text-lg font-semibold">{nft.name}</div>
            <div className="text-sm">{nft.merchants?.join(', ')}</div>
            <div className="mt-2">Points: {nft.points}</div>
          </>
        )
        break
      case 'Tiered':
        content = (
          <>
            <div className="text-lg font-semibold">{nft.name}</div>
            <div>{nft.merchant}</div>
            <Badge className={`mt-2 ${nft.tier === 'Gold' ? 'bg-yellow-500' : nft.tier === 'Silver' ? 'bg-gray-400' : 'bg-orange-600'}`}>
              {nft.tier} Tier
            </Badge>
            <div className="mt-2">
              {nft.points} / {nft.nextTierPoints} points to {nft.nextTier}
            </div>
          </>
        )
        break
      case 'Local':
        content = (
          <>
            <div className="text-lg font-semibold">{nft.name}</div>
            <div className="text-sm mb-2">Total Points: {nft.totalPoints}</div>
            <div className="space-y-1">
              {nft.businesses?.map((business, index) => (
                <div key={index} className="text-xs">
                  {business.name} ({business.sector}): {business.visits ? `${business.visits} visits` : `${business.purchases} purchases`}
                </div>
              ))}
            </div>
          </>
        )
        break
    }

    return (
      <Card 
        key={nft.id} 
        className="w-64 h-64 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setSelectedNFT(nft)}
      >
        <CardHeader>
          <CardTitle>{nft.type}</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          Click to view activity
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Loyalty Programs</h1>
      
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search programs, types, tiers, merchants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="punch-card">Punch Card</TabsTrigger>
          <TabsTrigger value="coalition">Coalition</TabsTrigger>
          <TabsTrigger value="tiered">Tiered</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {filteredNFTs.map(renderNFT)}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {selectedNFT ? `Showing activity for ${selectedNFT.name}` : 'Showing all recent activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>{activity.program}</TableCell>
                  <TableCell>{activity.activity}</TableCell>
                  <TableCell>{activity.reward}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://whatsonchain.com/tx/${activity.txHash}`, '_blank')}
                      className="space-x-2"
                    >
                      <span>View</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}