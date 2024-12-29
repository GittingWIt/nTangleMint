'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Search, Store, Gift, Users, ArrowRight } from 'lucide-react'
import { getWalletData } from '@/lib/wallet-utils'

interface Program {
  id: string
  name: string
  business: string
  type: 'punch-card' | 'tiered' | 'points' | 'coalition'
  category: string
  description: string
  participants: number
  image: string
}

const programs: Program[] = [
  {
    id: '1',
    name: "Coffee Lovers Rewards",
    business: "Brew Haven",
    type: "punch-card",
    category: "Food & Beverage",
    description: "Earn a free coffee after 10 purchases",
    participants: 1500,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: '2',
    name: "Bookworm Rewards",
    business: "Page Turner Books",
    type: "points",
    category: "Retail",
    description: "Earn points with every purchase, get exclusive discounts",
    participants: 800,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: '3',
    name: "Fitness First",
    business: "Elite Gym",
    type: "tiered",
    category: "Health & Fitness",
    description: "Unlock premium benefits as you level up",
    participants: 2000,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: '4',
    name: "Downtown Rewards",
    business: "City Business Alliance",
    type: "coalition",
    category: "Multi-merchant",
    description: "Earn points at multiple downtown businesses",
    participants: 5000,
    image: "/placeholder.svg?height=100&width=100"
  },
  {
    id: '5',
    name: "Deli Delights",
    business: "Fresh Bites",
    type: "punch-card",
    category: "Food & Beverage",
    description: "Buy 9 sandwiches, get 1 free",
    participants: 1200,
    image: "/placeholder.svg?height=100&width=100"
  }
]

const categories = [
  "All",
  "Food & Beverage",
  "Retail",
  "Health & Fitness",
  "Multi-merchant"
]

const programTypes = [
  { value: "all", label: "All Types" },
  { value: "punch-card", label: "Punch Card" },
  { value: "points", label: "Points" },
  { value: "tiered", label: "Tiered" },
  { value: "coalition", label: "Coalition" }
]

export default function Component() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('all')
  const walletData = getWalletData()

  const filteredPrograms = programs.filter(program => {
    const search = searchTerm.toLowerCase().trim()
    
    // Search across all relevant fields
    const searchableContent = [
      program.name,
      program.business,
      program.description,
      program.type,
      program.category,
      // Add common variations of program types for better matching
      program.type === 'punch-card' ? 'punchcard punches stamp stamps' : '',
      program.type === 'points' ? 'point rewards reward points-based' : '',
      program.type === 'tiered' ? 'tier levels level-based status' : '',
      program.type === 'coalition' ? 'multi business partnership partner' : ''
    ].join(' ').toLowerCase()

    const matchesSearch = search.split(' ').every(term => 
      searchableContent.includes(term)
    )
    
    const matchesCategory = selectedCategory === 'All' || program.category === selectedCategory
    const matchesType = selectedType === 'all' || program.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeColor = (type: Program['type']) => {
    const colors = {
      'punch-card': 'bg-blue-500',
      'points': 'bg-green-500',
      'tiered': 'bg-purple-500',
      'coalition': 'bg-orange-500'
    }
    return colors[type]
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {!walletData ? (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-4">Loyalty Reimagined</CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Empower your business with blockchain-based loyalty programs. Connect with customers, partner with local businesses, and grow your community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    For Users
                  </CardTitle>
                  <CardDescription>
                    Join loyalty programs and earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Manage all your rewards in one place</li>
                    <li>Track your progress across programs</li>
                    <li>Redeem rewards easily</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/wallet-generation">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="mr-2 h-5 w-5" />
                    For Merchants
                  </CardTitle>
                  <CardDescription>
                    Create and manage loyalty programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Create custom loyalty programs</li>
                    <li>Track customer engagement</li>
                    <li>Analyze program performance</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/wallet-generation">
                      Create Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>
              Continue to your dashboard to manage your {walletData.type === 'merchant' ? 'programs' : 'rewards'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={walletData.type === 'merchant' ? '/merchant' : '/user'}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Discover Loyalty Programs</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by program name, type, business, or description..."
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
              {programTypes.map(type => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(program => (
            <Card key={program.id} className="flex flex-col">
              <CardHeader>
                <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                  <img
                    src={program.image}
                    alt={program.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{program.name}</CardTitle>
                    <CardDescription>{program.business}</CardDescription>
                  </div>
                  <Badge variant="secondary" className={`${getTypeColor(program.type)} text-white`}>
                    {program.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{program.description}</p>
                <p className="text-sm mt-2">
                  <Users className="inline-block w-4 h-4 mr-1" />
                  {program.participants.toLocaleString()} participants
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/wallet-generation">
                    Join Program
                    <Gift className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}