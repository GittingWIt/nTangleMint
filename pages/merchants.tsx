'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Gift, TrendingUp, Settings, Calendar, Search, Edit, Trash2, Bell, Mail, Smartphone } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock data for the chart
const chartData = [
  { name: 'Jan', participants: 100, rewards: 20 },
  { name: 'Feb', participants: 120, rewards: 25 },
  { name: 'Mar', participants: 150, rewards: 30 },
  { name: 'Apr', participants: 180, rewards: 35 },
  { name: 'May', participants: 220, rewards: 45 },
  { name: 'Jun', participants: 270, rewards: 55 },
]

export default function MerchantsPage() {
  const [activePrograms, setActivePrograms] = useState(3)
  const [totalParticipants, setTotalParticipants] = useState(234)
  const [rewardsClaimed, setRewardsClaimed] = useState(45)
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m')

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <Button asChild>
          <Link href="/CreateNewProgram">
            Create New Program
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Active Programs</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activePrograms}</div>
            <p className="text-sm text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalParticipants}</div>
            <p className="text-sm text-muted-foreground">+23 from last month</p>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Rewards Claimed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rewardsClaimed}</div>
            <p className="text-sm text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Performance</CardTitle>
              <CardDescription>Overview of your loyalty programs' performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>Coffee Lovers</div>
                  <div className="text-sm text-muted-foreground">67% completion rate</div>
                </div>
                <Progress value={67} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>Sandwich Master</div>
                  <div className="text-sm text-muted-foreground">89% completion rate</div>
                </div>
                <Progress value={89} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>Book Club Rewards</div>
                  <div className="text-sm text-muted-foreground">45% completion rate</div>
                </div>
                <Progress value={45} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>Participant and reward trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Custom Range
                </Button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="participants" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="rewards" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Program</CardTitle>
                <CardDescription>Based on participant engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Sandwich Master</div>
                <div className="text-sm text-muted-foreground">89% completion rate</div>
                <Progress value={89} className="mt-2" />
                <div className="mt-4 text-sm text-muted-foreground">
                  <div>Total Participants: 87</div>
                  <div>Rewards Claimed: 32</div>
                  <div>Average Time to Completion: 14 days</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program with Most Growth</CardTitle>
                <CardDescription>Highest increase in participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coffee Lovers</div>
                <div className="text-sm text-muted-foreground">+45% growth this month</div>
                <Progress value={45} className="mt-2" />
                <div className="mt-4 text-sm text-muted-foreground">
                  <div>New Participants: 23</div>
                  <div>Total Participants: 74</div>
                  <div>Retention Rate: 92%</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>View and manage your loyalty program participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search customers" className="pl-8" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="coffee">Coffee Lovers</SelectItem>
                    <SelectItem value="sandwich">Sandwich Master</SelectItem>
                    <SelectItem value="book">Book Club Rewards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Alice Johnson", email: "alice@example.com", program: "Coffee Lovers", points: 1250, status: "Active" },
                    { name: "Bob Smith", email: "bob@example.com", program: "Sandwich Master", points: 980, status: "Active" },
                    { name: "Carol Williams", email: "carol@example.com", program: "Book Club Rewards", points: 875, status: "Inactive" },
                  ].map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.program}</TableCell>
                      <TableCell>{customer.points}</TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Customers</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Management</CardTitle>
              <CardDescription>Manage and track your loyalty program rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search rewards" className="pl-8" />
                </div>
                <Button>
                  <Gift className="mr-2 h-4 w-4" />
                  Add New Reward
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Points Required</TableHead>
                    <TableHead>Claimed</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Free Coffee", program: "Coffee Lovers", points: 100, claimed: 28, available: 72 },
                    { name: "50% Off Sandwich", program: "Sandwich Master", points: 150, claimed: 15, available: 35 },
                    { name: "Buy 1 Get 1 Free Book", program: "Book Club Rewards", points: 200, claimed: 5, available: 20 },
                  ].map((reward, index) => (
                    <TableRow key={index}>
                      <TableCell>{reward.name}</TableCell>
                      <TableCell>{reward.program}</TableCell>
                      <TableCell>{reward.points}</TableCell>
                      <TableCell>{reward.claimed}</TableCell>
                      <TableCell>{reward.available}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>Manage your loyalty program settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Automatic Rewards</div>
                    <div className="text-sm text-muted-foreground">Automatically issue rewards when criteria are met</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Point Expiration</div>
                    <div className="text-sm text-muted-foreground">Set expiration period for earned points</div>
                  </div>
                  <Select defaultValue="12m">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select expiration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="6m">6 months</SelectItem>
                      <SelectItem value="12m">12 months</SelectItem>
                      <SelectItem value="24m">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Send program updates via email</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">Send program updates via SMS</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Send program updates via mobile app</div>
                  </div>
                  <Switch />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Integration Settings</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">API Key</div>
                    <div className="text-sm text-muted-foreground">Your unique API key for integrations</div>
                  </div>
                  <Button variant="outline">View API Key</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Webhook URL</div>
                    <div className="text-sm text-muted-foreground">URL for receiving webhook notifications</div>
                  </div>
                  <Input placeholder="https://your-webhook-url.com" className="w-[300px]" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}