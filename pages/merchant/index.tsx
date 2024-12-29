'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ExternalLink, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { WalletData, Transaction } from '@/lib/wallet-types'
import { getWalletData } from '@/lib/wallet-utils'

type LoyaltyProgram = {
  id: number
  name: string
  type: string
  participants: number
  image: string
}

interface Activity {
  id: number
  date: string
  program: string
  activity: string
  customer: string
  txHash: string
  [key: string]: string | number
}

interface SortConfig {
  key: keyof Activity
  direction: 'ascending' |'descending'
}

const loyaltyPrograms: LoyaltyProgram[] = [
  {
    id: 1,
    name: "Coffee Lovers",
    type: "Punch Card",
    participants: 1500,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 2,
    name: "Sandwich Master",
    type: "Punch Card",
    participants: 800,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 3,
    name: "Book Worm",
    type: "Tiered",
    participants: 2000,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 4,
    name: "City Explorer",
    type: "Coalition",
    participants: 5000,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: 5,
    name: "Local Eats",
    type: "Local",
    participants: 3000,
    image: "/placeholder.svg?height=100&width=100"
  }
]

const recentActivity: Activity[] = [
  { id: 1, date: '2024-03-07', program: 'Coffee Lovers', activity: 'Purchase', customer: 'John D.', txHash: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' },
  { id: 2, date: '2024-03-05', program: 'Coffee Lovers', activity: 'Reward Claimed', customer: 'Sarah M.', txHash: '1J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
  { id: 3, date: '2024-03-03', program: 'Sandwich Master', activity: 'Purchase', customer: 'Emily R.', txHash: '1Lbcfr7sAHTD9CgdQo3HTR4rf7xzv7sj4u' },
  { id: 4, date: '2024-03-01', program: 'Book Worm', activity: 'Tier Upgrade', customer: 'Michael B.', txHash: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' },
  { id: 5, date: '2024-03-07', program: 'City Explorer', activity: 'New Enrollment', customer: 'Lisa K.', txHash: '1J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
]

export default function MerchantsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<LoyaltyProgram | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [activitySortConfig, setActivitySortConfig] = useState<SortConfig | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)

  useEffect(() => {
    const data = getWalletData()
    if (data && data.type === 'merchant') {
      setWalletData(data)
    } else {
      router.push('/')
    }
  }, [router])

  const filteredPrograms = useMemo(() => {
    return loyaltyPrograms.filter(program => {
      const searchLower = searchTerm.toLowerCase()
      return (
        program.name.toLowerCase().includes(searchLower) ||
        program.type.toLowerCase().includes(searchLower)
      )
    }).filter(program => activeTab === 'all' || program.type.toLowerCase().replace(' ', '-') === activeTab)
  }, [searchTerm, activeTab])

  const filteredActivity = selectedProgram
    ? recentActivity.filter(activity => activity.program === selectedProgram.name)
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

  const renderLoyaltyProgram = (program: LoyaltyProgram) => {
    return (
      <Card key={program.id} className="w-[250px] flex flex-col">
        <CardHeader>
          <img src={program.image} alt={program.name} className="w-full h-32 object-cover rounded-t-lg" />
        </CardHeader>
        <CardContent className="flex-grow">
          <CardTitle>{program.name}</CardTitle>
          <CardDescription>{program.type}</CardDescription>
          <p className="text-sm mt-2">Participants: {program.participants}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setSelectedProgram(program)}>View Activity</Button>
        </CardFooter>
      </Card>
    )
  }

  if (!walletData) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Loyalty Programs</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Program
        </Button>
      </div>
      
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search programs..."
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
              {filteredPrograms.map(renderLoyaltyProgram)}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {selectedProgram ? `Showing activity for ${selectedProgram.name}` : 'Showing all recent activity'}
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
                <TableHead onClick={() => requestSort('customer')} className="cursor-pointer">
                  Customer
                  {activitySortConfig?.key === 'customer' && (
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
                  <TableCell>{activity.customer}</TableCell>
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