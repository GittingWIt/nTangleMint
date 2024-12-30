'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Users, Gift, Search, Edit, Trash2, Plus, ChevronUp, ChevronDown, Calendar, ExternalLink, Copy, Check, TrendingUp, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { WalletData } from '@/lib/wallet-types'
import { getWalletData, shortenAddress } from '@/lib/wallet-utils'

interface Customer {
  walletAddress: string
  programs: {
    program: string
    points: number
    status: 'Active' | 'Inactive'
  }[]
  totalPoints: number
}

// Mock data
const customers: Customer[] = [
  {
    walletAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    programs: [
      { program: "Coffee Lovers", points: 1250, status: "Active" },
      { program: "Sandwich Master", points: 450, status: "Active" }
    ],
    totalPoints: 1700
  },
  {
    walletAddress: "1J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    programs: [
      { program: "Sandwich Master", points: 980, status: "Active" },
      { program: "Book Club Rewards", points: 320, status: "Active" }
    ],
    totalPoints: 1300
  },
  {
    walletAddress: "1Lbcfr7sAHTD9CgdQo3HTR4rf7xzv7sj4u",
    programs: [
      { program: "Book Club Rewards", points: 875, status: "Inactive" },
      { program: "Coffee Lovers", points: 220, status: "Active" }
    ],
    totalPoints: 1095
  }
]

const programs = [
  {
    name: "Coffee Lovers",
    completionRate: 67,
    participants: 100,
    rewards: 45
  },
  {
    name: "Sandwich Master",
    completionRate: 89,
    participants: 150,
    rewards: 67
  },
  {
    name: "Book Club Rewards",
    completionRate: 45,
    participants: 80,
    rewards: 23
  }
]

const generateChartData = (days: number) => {
  return Array.from({ length: days }).map((_, i) => ({
    name: `Day ${i + 1}`,
    participants: Math.floor(Math.random() * 50) + 200,
    rewards: Math.floor(Math.random() * 20) + 30
  }))
}

export default function MerchantDashboard() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [chartData] = useState(() => generateChartData(30))

  useEffect(() => {
    const data = getWalletData()
    if (data && data.type === 'merchant') {
      setWalletData(data)
    } else {
      router.push('/')
    }
  }, [router])

  const toggleWalletExpansion = (walletAddress: string) => {
    setExpandedWallets(prev => {
      const next = new Set(prev)
      if (next.has(walletAddress)) {
        next.delete(walletAddress)
      } else {
        next.add(walletAddress)
      }
      return next
    })
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.programs.some(p => 
          p.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.status.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      const matchesProgram = selectedProgram === 'all' || 
        customer.programs.some(p => p.program === selectedProgram)
      
      return matchesSearch && matchesProgram
    })
  }, [searchTerm, selectedProgram])

  const copyAddress = async () => {
    if (!walletData?.publicAddress) return
    
    try {
      await navigator.clipboard.writeText(walletData.publicAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address')
    }
  }

  if (!walletData) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={copyAddress}
          >
            {shortenAddress(walletData.publicAddress)}
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button asChild>
            <Link href="/create-program" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Program
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Active Programs</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">+23 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Rewards Claimed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Performance</CardTitle>
              <CardDescription>Overview of your loyalty programs' performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {programs.map(program => (
                <div key={program.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{program.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {program.completionRate}% completion rate
                    </div>
                  </div>
                  <Progress value={program.completionRate} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{program.participants} participants</span>
                    <span>{program.rewards} rewards claimed</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>30-day participant and reward trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="participants" 
                      stroke="#8884d8" 
                      name="Participants"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rewards" 
                      stroke="#82ca9d" 
                      name="Rewards"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>View and manage your loyalty program participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-[300px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(program => (
                      <SelectItem key={program.name} value={program.name}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead>Total Points</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <>
                      <TableRow 
                        key={customer.walletAddress}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleWalletExpansion(customer.walletAddress)}
                      >
                        <TableCell className="font-mono">{customer.walletAddress}</TableCell>
                        <TableCell>{customer.programs.length} Programs</TableCell>
                        <TableCell>{customer.totalPoints}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedWallets.has(customer.walletAddress) && (
                        <TableRow key={`${customer.walletAddress}-details`}>
                          <TableCell colSpan={4} className="bg-muted/30">
                            <div className="pl-4 py-2 space-y-2">
                              {customer.programs.map((program, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium">{program.program}</span>
                                    <Badge variant={program.status === "Active" ? "default" : "secondary"}>
                                      {program.status}
                                    </Badge>
                                  </div>
                                  <span>{program.points} points</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your merchant account and program settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Merchant Details</h3>
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Business Name</label>
                    <Input placeholder="Enter your business name" />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input type="email" placeholder="Enter your contact email" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Program Settings</h3>
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Default Points Expiry</label>
                    <Select defaultValue="12">
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}