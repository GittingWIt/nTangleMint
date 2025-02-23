'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getWalletData } from '@/lib/bsv/wallet'
import { programUtils, type Program } from '@/lib/utils/program-utils'
import type { WalletData } from '@/types'
import { WelcomeSection } from './WelcomeSection'
import { ProgramsList } from './ProgramsList'

const programTypes = [
  { value: "all", label: "All Types" },
  { value: "punch-card", label: "Punch Card" },
  { value: "points", label: "Points" },
  { value: "tiered", label: "Tiered" },
  { value: "coalition", label: "Coalition" }
] as const

const categories = [
  "All",
  "Food & Beverage",
  "Retail",
  "Health & Fitness",
  "Multi-merchant"
] as const

export default function HomeContent() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>('All')
  const [selectedType, setSelectedType] = useState<typeof programTypes[number]['value']>('all')
  const [allPrograms, setAllPrograms] = useState<Program[]>([])
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkWalletStatus = () => {
      try {
        const data = getWalletData()
        setWalletData(data)

        const programs = programUtils.getAllPrograms()
        setAllPrograms(Array.isArray(programs) ? programs : [])

        if (data?.type === 'user') {
          const userParticipation = programUtils.getUserParticipation(data.publicAddress)
          const joinedProgramIds = userParticipation.map(p => p.programId)
          setJoinedPrograms(joinedProgramIds)
        }
      } catch (error) {
        console.error('Error checking wallet status:', error)
        setError(error instanceof Error ? error.message : 'Failed to check wallet status')
        setWalletData(null)
        setJoinedPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    checkWalletStatus()
    window.addEventListener('walletUpdated', checkWalletStatus)
    return () => window.removeEventListener('walletUpdated', checkWalletStatus)
  }, [])

  const handleJoinProgram = (program: Program) => {
    if (!walletData) {
      router.push('/wallet-generation')
      return
    }

    try {
      const existingProgram = allPrograms.find(p => 
        p.id !== program.id && 
        p.businessName?.toLowerCase() === program.businessName?.toLowerCase() &&
        joinedPrograms.includes(p.id)
      )

      if (existingProgram) {
        setError('You have already joined a program from this business')
        return
      }

      const success = programUtils.joinProgram(program.id, walletData.publicAddress)
      if (success) {
        setAllPrograms(prev => prev.map(p => {
          if (p.id === program.id) {
            return { ...p, participants: [...p.participants, walletData.publicAddress] }
          }
          return p
        }))
        setJoinedPrograms(prev => [...prev, program.id])
        setError(null)
      } else {
        setError('Failed to join program')
      }
    } catch (err) {
      console.error('Error joining program:', err)
      setError(err instanceof Error ? err.message : 'Failed to join program')
    }
  }

  const filteredPrograms = allPrograms.filter(program => {
    const search = searchTerm.toLowerCase().trim()
    
    const searchableContent = [
      program.name,
      program.businessName,
      program.description,
      program.type,
      program.category
    ].filter(Boolean).join(' ').toLowerCase()

    const matchesSearch = search === '' || search.split(' ').every(term => 
      searchableContent.includes(term)
    )
    
    const matchesCategory = selectedCategory === 'All' || program.category === selectedCategory
    const matchesType = selectedType === 'all' || program.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[200px]">Loading...</div>
  }

  return (
    <>
      <WelcomeSection walletData={walletData} />

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
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

        <ProgramsList
          programs={filteredPrograms}
          walletData={walletData}
          joinedPrograms={joinedPrograms}
          onJoinProgram={handleJoinProgram}
        />
      </div>
    </>
  )
}