'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Gift, Boxes, Bell, Mail, MessageSquare, Wrench, KeyRound, Globe, AlertCircle, Plus, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { WalletData } from '@/lib/wallet-types'
import { getWalletData } from '@/lib/wallet-utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Program {
  id: string
  name: string
  type: 'punch-card' | 'tiered' | 'points' | 'coalition'
  description: string
  participants: string[] // BSV public addresses
  rewards_claimed: number
  created_at: string
  merchantId: string
}

interface CustomerActivity {
  address: string
  programId: string
  points: number
  rewards_claimed: number
  last_active: string
}

export default function MerchantDashboard() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
    const data = getWalletData()
    if (data && data.type === 'merchant') {
      setWalletData(data)
      // Load merchant-specific programs
      const storedPrograms = JSON.parse(localStorage.getItem('programs') || '{}')
      const merchantPrograms = storedPrograms[data.publicAddress] || []
      setPrograms(merchantPrograms)

      // Load customer activities
      const activities = JSON.parse(localStorage.getItem('customerActivities') || '{}')
      const merchantActivities = activities[data.publicAddress] || []
      setCustomerActivities(merchantActivities)
    } else {
      router.push('/')
    }
  }, [router])

  // Listen for new program creation
  useEffect(() => {
    const handleProgramCreated = (event: CustomEvent) => {
      setPrograms(prev => [...prev, event.detail])
    }

    window.addEventListener('programCreated', handleProgramCreated as EventListener)
    return () => {
      window.removeEventListener('programCreated', handleProgramCreated as EventListener)
    }
  }, [])

  const getAnalyticsData = () => {
    const monthlyData: { [key: string]: { participants: number, rewards: number } } = {}
    
    customerActivities
      .filter(activity => selectedProgram === 'all' || activity.programId === selectedProgram)
      .forEach(activity => {
        const month = new Date(activity.last_active).toLocaleString('default', { month: 'short' })
        if (!monthlyData[month]) {
          monthlyData[month] = { participants: 0, rewards: 0 }
        }
        monthlyData[month].participants++
        monthlyData[month].rewards += activity.rewards_claimed
      })

    return Object.entries(monthlyData).map(([name, data]) => ({
      name,
      ...data
    }))
  }

  const filteredCustomers = customerActivities.filter(activity => {
    const matchesProgram = selectedProgram === 'all' || activity.programId === selectedProgram
    const matchesSearch = activity.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesProgram && matchesSearch
  })

  if (!mounted || !walletData) {
    return null
  }

  const stats = {
    activePrograms: programs.length,
    totalParticipants: new Set(customerActivities.map(a => a.address)).size,
    rewardsClaimed: customerActivities.reduce((sum, a) => sum + a.rewards_claimed, 0)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <Button asChild>
          <Link href="/create-program" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Program
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Active Programs</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePrograms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Rewards Claimed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rewardsClaimed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>Your Programs</CardTitle>
              <CardDescription>Manage your loyalty programs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Rewards Claimed</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map(program => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.type}</TableCell>
                      <TableCell>{program.participants.length}</TableCell>
                      <TableCell>{program.rewards_claimed}</TableCell>
                      <TableCell>{new Date(program.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Activity</CardTitle>
                <CardDescription>View customer participation across programs</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by BSV address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[300px]"
                  />
                </div>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BSV Address</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Rewards Claimed</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((activity, index) => (
                    <TableRow key={`${activity.address}-${activity.programId}`}>
                      <TableCell className="font-mono">{activity.address}</TableCell>
                      <TableCell>
                        {programs.find(p => p.id === activity.programId)?.name || 'Unknown Program'}
                      </TableCell>
                      <TableCell>{activity.points}</TableCell>
                      <TableCell>{activity.rewards_claimed}</TableCell>
                      <TableCell>{new Date(activity.last_active).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Program Performance</CardTitle>
                <CardDescription>Program-specific analytics overview</CardDescription>
              </div>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAnalyticsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="participants" fill="#8884d8" name="Participants" />
                    <Bar yAxisId="right" dataKey="rewards" fill="#82ca9d" name="Rewards" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notifications" onCheckedChange={(checked) => setShowEmailInput(checked)} />
                  </div>
                </div>
                {showEmailInput && (
                  <div className="ml-9 mt-2">
                    <Input 
                      type="email" 
                      placeholder="Enter notification email" 
                      className="max-w-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>Manage your API and webhook settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Keep your API key secure. Do not share it publicly.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-4">
                      <KeyRound className="h-5 w-5 text-muted-foreground" />
                      <Label>API Key & Recovery</Label>
                    </div>
                    <div className="space-x-2">
                      <Button variant="secondary" onClick={() => setShowRecovery(!showRecovery)}>
                        {showRecovery ? 'Hide Recovery Phrase' : 'Show Recovery Phrase'}
                      </Button>
                      <Button variant="secondary">View API Key</Button>
                    </div>
                  </div>
                  {showRecovery && (
                    <Alert className="mt-2">
                      <AlertDescription className="font-mono text-sm">
                        abandon ability able about above absent absorb abstract absurd abuse access accident
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                    </div>
                    <Input
                      id="webhook-url"
                      placeholder="https://your-webhook-url.com"
                      className="font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}