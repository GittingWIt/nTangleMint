'use client'

import { useState, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'

type NFT = {
  id: number
  name: string
  type: string
  merchant?: string
  tier?: string
  merchants?: string[]
  businesses?: { name: string; sector: string }[]
  image: string
}

interface Activity {
  id: number
  date: string
  program: string
  activity: string
  reward: string
  txHash: string
  [key: string]: string | number // Add index signature for dynamic access
}

// Define the type for sort configuration
interface SortConfig {
  key: keyof Activity
  direction: 'ascending' | 'descending'
}

const nfts: NFT[] = [
  {
    id: 1,
    name: "Coffee Lovers",
    type: "Punch Card",
    merchant: "Brew Haven",
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 2,
    name: "Sandwich Master",
    type: "Punch Card",
    merchant: "Deli Delights",
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 3,
    name: "Book Worm",
    type: "Tiered",
    tier: "Gold",
    merchant: "Page Turner Books",
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 4,
    name: "City Explorer",
    type: "Coalition",
    merchants: ["Museum of History", "Art Gallery", "Science Center"],
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 5,
    name: "Local Eats",
    type: "Local",
    businesses: [
      { name: "Joe's Pizza", sector: "Restaurant" },
      { name: "Green Grocer", sector: "Grocery" },
      { name: "Sweet Tooth Bakery", sector: "Bakery" }
    ],
    image: "/placeholder.svg?height=100&width=100"
  }
]

const recentActivity: Activity[] = [
  { id: 1, date: '2024-03-07', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' },
  { id: 2, date: '2024-03-05', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '1J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
  { id: 3, date: '2024-03-03', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '1Lbcfr7sAHTD9CgdQo3HTR4rf7xzv7sj4u' },
  { id: 4, date: '2024-03-01', program: 'Coffee Lovers', activity: 'Purchase', reward: '1 punch', txHash: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' },
  { id: 5, date: '2024-03-07', program: 'Sandwich Master', activity: 'Purchase', reward: '1 punch', txHash: '1J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [activitySortConfig, setActivitySortConfig] = useState<SortConfig | null>(null)

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

  const sortedActivity = useMemo(() => {
    if (!activitySortConfig) return filteredActivity
    return [...filteredActivity].sort((a, b) => {
      if (a[activitySortConfig.key] < b[activitySortConfig.key]) {
        return activitySortConfig.direction === 'ascending' ? -1 : 1
      }
      if (a[activitySortConfig.key] > b[activitySortConfig.key]) {
        return activitySortConfig.direction === 'ascending' ? 1 : -1
      }
      return 0
    })
  }, [filteredActivity, activitySortConfig])

  const requestSort = (key: keyof Activity) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (activitySortConfig && activitySortConfig.key === key && activitySortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setActivitySortConfig({ key, direction })
  }

  const renderNFT = (nft: NFT) => {
    return (
      <Card key={nft.id} className="w-[250px] flex flex-col">
        <CardHeader>
          <img src={nft.image} alt={nft.name} className="w-full h-32 object-cover rounded-t-lg" />
        </CardHeader>
        <CardContent className="flex-grow">
          <CardTitle>{nft.name}</CardTitle>
          <CardDescription>{nft.type}</CardDescription>
          {nft.merchant && <p className="text-sm mt-2">Merchant: {nft.merchant}</p>}
          {nft.tier && <p className="text-sm mt-2">Tier: {nft.tier}</p>}
          {nft.merchants && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Participating Merchants:</p>
              <ul className="text-sm list-disc list-inside">
                {nft.merchants.map((merchant, index) => (
                  <li key={index}>{merchant}</li>
                ))}
              </ul>
            </div>
          )}
          {nft.businesses && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Participating Businesses:</p>
              <ul className="text-sm list-disc list-inside">
                {nft.businesses.map((business, index) => (
                  <li key={index}>{business.name} ({business.sector})</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setSelectedNFT(nft)}>View Activity</Button>
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
                <TableHead onClick={() => requestSort('date')} className="cursor-pointer">
                  Date
                  {activitySortConfig?.key === 'date' && (
                    activitySortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                  )}
                </TableHead>
                <TableHead onClick={() => requestSort('program')} className="cursor-pointer">
                  Program
                  {activitySortConfig?.key === 'program' && (
                    activitySortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                  )}
                </TableHead>
                <TableHead onClick={() => requestSort('activity')} className="cursor-pointer">
                  Activity
                  {activitySortConfig?.key === 'activity' && (
                    activitySortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                  )}
                </TableHead>
                <TableHead onClick={() => requestSort('reward')} className="cursor-pointer">
                  Reward
                  {activitySortConfig?.key === 'reward' && (
                    activitySortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                  )}
                </TableHead>
                <TableHead className="text-right">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActivity.map((activity) => (
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