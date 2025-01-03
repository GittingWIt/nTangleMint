'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

const defaultPrograms: Program[] = [
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
  // ... other default programs
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

export default function HomePage() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<ReturnType<typeof getWalletData> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('all')
  const [allPrograms, setAllPrograms] = useState<Program[]>([])
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([])

  useEffect(() => {
    const data = getWalletData()
    setWalletData(data)

    // Load default programs and any custom programs
    const globalPrograms = JSON.parse(localStorage.getItem('globalPrograms') || '[]')
    setAllPrograms([...defaultPrograms, ...globalPrograms])

    // Load user's joined programs
    if (data?.type === 'user') {
      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${data.publicAddress}`) || '[]')
      setJoinedPrograms(userPrograms)
    }
  }, [])

  const handleJoinProgram = (program: Program) => {
    if (!walletData) {
      router.push('/wallet-generation')
      return
    }

    // Update program participants
    const updatedPrograms = allPrograms.map(p => {
      if (p.id === program.id) {
        return { ...p, participants: p.participants + 1 }
      }
      return p
    })
    setAllPrograms(updatedPrograms)
    localStorage.setItem('globalPrograms', JSON.stringify(updatedPrograms))

    // Add to user's programs
    const updatedJoinedPrograms = [...joinedPrograms, program.id]
    setJoinedPrograms(updatedJoinedPrograms)
    localStorage.setItem(`userPrograms_${walletData.publicAddress}`, JSON.stringify(updatedJoinedPrograms))
  }

  const filteredPrograms = allPrograms.filter(program => {
    const search = searchTerm.toLowerCase().trim()
    
    const searchableContent = [
      program.name,
      program.business,
      program.description,
      program.type,
      program.category,
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
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/program/${program.id}`)}
                >
                  View Details
                </Button>
                {walletData?.type === 'user' && (
                  <Button 
                    className="flex-1"
                    disabled={joinedPrograms.includes(program.id)}
                    onClick={() => handleJoinProgram(program)}
                  >
                    {joinedPrograms.includes(program.id) ? 'Joined' : 'Join Program'}
                    <Gift className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}