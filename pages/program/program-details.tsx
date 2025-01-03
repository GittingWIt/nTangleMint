'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Gift, Users, Trophy, Wallet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { getWalletData } from '@/lib/wallet-utils'

interface Program {
  id: string
  name: string
  business: string
  type: 'punch-card' | 'tiered' | 'points' | 'coalition'
  category: string
  description: string
  participants: number
  rewards_claimed: number
  image: string
  merchantId: string
  rewardStructure?: string
  isOpenEnded?: boolean
}

export default function ProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [walletData, setWalletData] = useState<ReturnType<typeof getWalletData> | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const data = getWalletData()
    setWalletData(data)

    // Load program data
    const globalPrograms = JSON.parse(localStorage.getItem('globalPrograms') || '[]')
    const foundProgram = globalPrograms.find((p: Program) => p.id === params.id)
    setProgram(foundProgram)

    // Check if user has already joined
    if (data?.type === 'user') {
      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${data.publicAddress}`) || '[]')
      setIsJoined(userPrograms.some((p: string) => p === params.id))
    }
  }, [params.id])

  const handleJoinProgram = () => {
    if (!walletData || !program) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      // Update program participants
      const globalPrograms = JSON.parse(localStorage.getItem('globalPrograms') || '[]')
      const updatedPrograms = globalPrograms.map((p: Program) => {
        if (p.id === program.id) {
          return { ...p, participants: p.participants + 1 }
        }
        return p
      })
      localStorage.setItem('globalPrograms', JSON.stringify(updatedPrograms))

      // Add to user's programs
      const userPrograms = JSON.parse(localStorage.getItem(`userPrograms_${walletData.publicAddress}`) || '[]')
      userPrograms.push(program.id)
      localStorage.setItem(`userPrograms_${walletData.publicAddress}`, JSON.stringify(userPrograms))

      setIsJoined(true)
      setLoading(false)
    }, 1000)
  }

  if (!program) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertTitle>Program Not Found</AlertTitle>
          <AlertDescription>
            The program you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getTypeColor = (type: Program['type']) => {
    const colors = {
      'punch-card': 'bg-blue-500',
      'points': 'bg-green-500',
      'tiered': 'bg-purple-500',
      'coalition': 'bg-orange-500'
    }
    return colors[type]
  }

  const renderRewardStructure = () => {
    switch (program.type) {
      case 'punch-card':
        return (
          <div className="grid gap-4">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Complete 10 purchases to earn a free reward</p>
          </div>
        )
      case 'tiered':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Points Required</TableHead>
                <TableHead>Benefits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Bronze</TableCell>
                <TableCell>0</TableCell>
                <TableCell>Basic rewards and birthday bonus</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Silver</TableCell>
                <TableCell>1000</TableCell>
                <TableCell>5% bonus rewards + Bronze benefits</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Gold</TableCell>
                <TableCell>5000</TableCell>
                <TableCell>10% bonus rewards + Silver benefits</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )
      default:
        return (
          <p className="text-sm text-muted-foreground">
            {program.rewardStructure || 'Earn points with every purchase and redeem them for exclusive rewards.'}
          </p>
        )
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                  <CardDescription className="text-lg">{program.business}</CardDescription>
                </div>
                <Badge variant="secondary" className={`${getTypeColor(program.type)} text-white`}>
                  {program.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                <img
                  src={program.image}
                  alt={program.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="text-muted-foreground">{program.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward Structure</CardTitle>
              <CardDescription>How to earn and redeem rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRewardStructure()}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{program.participants.toLocaleString()} participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>{program.rewards_claimed || 0} rewards claimed</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span>{program.isOpenEnded ? 'Open-ended program' : 'Limited-time program'}</span>
              </div>
            </CardContent>
            <CardFooter>
              {walletData?.type === 'user' && (
                <Button 
                  className="w-full" 
                  disabled={isJoined || loading}
                  onClick={handleJoinProgram}
                >
                  {loading ? 'Joining...' : isJoined ? 'Already Joined' : 'Join Program'}
                  <Gift className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}