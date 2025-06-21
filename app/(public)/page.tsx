"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import type { WalletData, Program } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ShoppingBag,
  Trophy,
  Gift,
  Store,
  Ticket,
  ArrowRight,
  Calendar,
  Tag,
  Coffee,
  Search,
} from "lucide-react"

// Simplified imports
import { debug } from "@/lib/debug"

// Simple loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// Enhanced program card component
function EnhancedProgramCard({ program, onInteract, hasJoined, walletData }: any) {
  console.log("🔥 EnhancedProgramCard rendering:", program.name)
  console.log("🔥 Program metadata:", program.metadata)

  // Check if program is expired
  const checkExpiration = () => {
    const expirationDate = program.metadata?.expirationDate || program.expirationDate
    if (!expirationDate) return false

    const expDate = new Date(expirationDate)
    const today = new Date()

    console.log("🔥 Checking expiration for:", program.name)
    console.log("🔥 Expiration date:", expirationDate, "->", expDate)
    console.log("🔥 Today:", today)
    console.log("🔥 Is expired?", today > expDate)

    return today > expDate
  }

  const isExpired = checkExpiration()

  // Calculate days left if expiration date exists
  const calculateDaysLeft = () => {
    const expirationDate = program.metadata?.expirationDate || program.expirationDate
    if (!expirationDate) return null

    const expDate = new Date(expirationDate)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const daysLeft = calculateDaysLeft()

  // Determine card color based on program type and expiration
  const getCardColorClass = () => {
    if (isExpired) return "bg-red-50 border-red-200"
    return program.type === "coupon-book" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
  }

  // Determine icon based on program type
  const ProgramIcon = program.type === "coupon-book" ? Tag : Coffee

  // Replace the isMerchant prop usage with:
  const isMerchantAddress = walletData?.publicAddress === "19jXXicm7YynAH73xcau38pkSQKjZQer"

  // And update the button text logic:
  const buttonText = isMerchantAddress
    ? program.merchantAddress === walletData.publicAddress
      ? "Manage Program"
      : "View Details"
    : hasJoined
      ? "Joined"
      : isExpired
        ? "Expired"
        : "Join Program"

  // Format expiration date display
  const formatExpirationDisplay = () => {
    const expirationDate = program.metadata?.expirationDate || program.expirationDate
    if (!expirationDate) return null

    const expDate = new Date(expirationDate)
    const formattedDate = expDate.toLocaleDateString()

    if (daysLeft === null) return `Expires: ${formattedDate}`

    if (daysLeft < 0) {
      return `Expired: ${formattedDate} (${Math.abs(daysLeft)} days ago)`
    } else if (daysLeft === 0) {
      return `Expires: ${formattedDate} (today)`
    } else {
      return `Expires: ${formattedDate} (${daysLeft} days left)`
    }
  }

  return (
    <div className={`rounded-lg border p-0 overflow-hidden ${getCardColorClass()}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <ProgramIcon
              className={
                isExpired ? "text-red-600" : program.type === "coupon-book" ? "text-green-600" : "text-amber-600"
              }
              size={20}
            />
            <h3 className="text-lg font-semibold">{program.name}</h3>
          </div>
          <Badge
            variant="outline"
            className={
              isExpired ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-green-100 text-green-800 hover:bg-green-100"
            }
          >
            {isExpired ? "Expired" : "Active"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">{program.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-gray-500" />
            <span>Store: {program.merchantName || "Unknown Merchant"}</span>
          </div>

          {(program.metadata?.expirationDate || program.expirationDate) && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <span className={isExpired ? "text-red-600" : ""}>{formatExpirationDisplay()}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span>{program.participants?.length || 0} participants</span>
          </div>
        </div>
      </div>

      <div
        className={isExpired ? "bg-red-100" : program.type === "coupon-book" ? "bg-green-100" : "bg-amber-100"}
        style={{ padding: "0.75rem 1rem" }}
      >
        <div className="flex items-center gap-2 mb-2">
          {program.type === "coupon-book" ? (
            <>
              <Tag size={16} className={isExpired ? "text-red-700" : "text-green-700"} />
              <span className={`font-medium ${isExpired ? "text-red-800" : "text-green-800"}`}>Discount Program</span>
              <span className={`ml-auto font-medium ${isExpired ? "text-red-800" : "text-green-800"}`}>
                {program.metadata?.discountAmount}% off
              </span>
            </>
          ) : (
            <>
              <Coffee size={16} className={isExpired ? "text-red-700" : "text-amber-700"} />
              <span className={`font-medium ${isExpired ? "text-red-800" : "text-amber-800"}`}>Punch Card Program</span>
              <span className={`ml-auto font-medium ${isExpired ? "text-red-800" : "text-amber-800"}`}>
                {program.metadata?.requiredPunches || 5} punches
              </span>
            </>
          )}
        </div>

        <div className="space-y-1 text-sm">
          {program.type === "coupon-book" ? (
            <>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-green-500"}`}></div>
                <span>Product: {program.metadata?.products?.[0]?.name || "Product"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-green-500"}`}></div>
                <span>Usage: No redemptions yet</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-amber-500"}`}></div>
                <span>Reward: {program.metadata?.reward || "Reward"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-amber-500"}`}></div>
                <span>Completion Rate: 0%</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-3 bg-white flex justify-end">
        <Button
          onClick={() => onInteract(program)}
          disabled={(!isMerchantAddress && hasJoined) || isExpired}
          variant={isMerchantAddress ? "outline" : "default"}
          size="sm"
          className={isExpired ? "opacity-50 cursor-not-allowed" : ""}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

export default function Home() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  console.log("🔥 Home component rendering")

  // Load wallet data
  useEffect(() => {
    try {
      const walletStr = localStorage.getItem("walletData")
      const data = walletStr ? JSON.parse(walletStr) : null
      setWalletData(data)
    } catch (error) {
      console.error("Error loading wallet data:", error)
    }
  }, [])

  // Load programs
  useEffect(() => {
    try {
      const programsStr = localStorage.getItem("programs")
      const loadedPrograms = programsStr ? JSON.parse(programsStr) : []
      console.log("🔥 Loaded programs:", loadedPrograms)
      setPrograms(loadedPrograms)
      debug(`Loaded ${loadedPrograms.length} programs`)
    } catch (error) {
      console.error("Error loading programs:", error)
      setPrograms([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Program interaction function
  const handleProgramInteraction = useCallback(
    (program: any) => {
      if (!walletData?.publicAddress) {
        // Redirect to wallet creation
        window.location.href = "/wallet-generation"
        return
      }

      // If user is a merchant, navigate to program details
      if (walletData.publicAddress === "19jXXicm7YynAH73xcau38pkSQKjZQer") {
        // This is the known merchant address
        if (program.merchantAddress === walletData.publicAddress) {
          window.location.href = `/merchant/programs/${program.id}`
        } else {
          window.location.href = `/merchant/programs/${program.id}`
        }
        return
      }

      // For all other addresses (customers), handle joining the program
      try {
        console.log("🔄 Starting program join process...")
        console.log("📋 Current program participants:", program.participants)

        // Ensure participants is an array
        if (!Array.isArray(program.participants)) {
          program.participants = []
          console.log("🔧 Initialized participants array")
        }

        // Check if user is already a participant
        if (program.participants.includes(walletData.publicAddress)) {
          alert(`You're already a member of ${program.name}!`)
          return
        }

        // Add user to program participants
        const updatedParticipants = [...program.participants, walletData.publicAddress]
        const updatedProgram = { ...program, participants: updatedParticipants }

        console.log("📝 Updated participants:", updatedParticipants)

        // Get all programs from localStorage
        const allProgramsStr = localStorage.getItem("programs")
        const allPrograms = allProgramsStr ? JSON.parse(allProgramsStr) : []

        // Find and update the specific program
        const programIndex = allPrograms.findIndex((p: Program) => p.id === program.id)
        if (programIndex !== -1) {
          allPrograms[programIndex] = updatedProgram
          console.log("✅ Updated program in array")
        } else {
          console.log("⚠️ Program not found in array, adding it")
          allPrograms.push(updatedProgram)
        }

        // Save back to localStorage
        localStorage.setItem("programs", JSON.stringify(allPrograms))
        console.log("💾 Saved programs to localStorage")

        // Verify the save worked
        const verifyStr = localStorage.getItem("programs")
        const verifyPrograms = verifyStr ? JSON.parse(verifyStr) : []
        const verifyProgram = verifyPrograms.find((p: Program) => p.id === program.id)
        console.log("🔍 Verification - Program participants:", verifyProgram?.participants)
        console.log(
          "🔍 Verification - User in participants?",
          verifyProgram?.participants?.includes(walletData.publicAddress),
        )

        // Update local state
        setPrograms((prev) => prev.map((p) => (p.id === program.id ? updatedProgram : p)))

        // Dispatch storage event to notify other components
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new Event("programsUpdated"))

        alert(`Successfully joined ${program.name}!`)
        console.log("🎉 Program join complete!")
      } catch (error) {
        console.error("❌ Error joining program:", error)
        alert("Error joining program. Please try again.")
      }
    },
    [walletData],
  )

  // Filter programs based on search term
  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Loyalty Reimagined</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Empower your business with blockchain-based loyalty programs. Connect with customers, partner with local
          businesses, and grow your community.
        </p>
      </section>

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              For Users
            </CardTitle>
            <CardDescription>Join loyalty programs and earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Manage all your rewards in one place
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Track your progress across programs
              </li>
              <li className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Redeem rewards easily
              </li>
            </ul>
            <Link href={walletData ? "/dashboard" : "/wallet-generation"}>
              <Button className="w-full">{walletData ? "View Dashboard" : "Get Started"}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              For Merchants
            </CardTitle>
            <CardDescription>Create and manage loyalty programs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                Create custom loyalty programs
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Track customer engagement
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Analyze program performance
              </li>
            </ul>
            <Link href={walletData?.type === "merchant" ? "/merchant" : "/wallet-generation"}>
              <Button className="w-full">
                {walletData?.type === "merchant" ? "Merchant Dashboard" : "Create Program"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Programs Section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Featured Programs</h2>
          <Button variant="outline" className="gap-2">
            View All Programs
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Programs</TabsTrigger>
            <TabsTrigger value="punch-card">Punch Cards</TabsTrigger>
            <TabsTrigger value="coupon-book">Coupon Books</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((program) => (
                  <EnhancedProgramCard
                    key={program.id}
                    program={program}
                    onInteract={handleProgramInteraction}
                    hasJoined={walletData?.publicAddress && program.participants?.includes(walletData.publicAddress)}
                    walletData={walletData}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Programs Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Programs will appear here when merchants create them through the platform.
                  </p>
                  <div className="space-x-2">
                    <Link href="/wallet-generation">
                      <Button variant="outline">Get Started</Button>
                    </Link>
                    {walletData?.type === "merchant" && (
                      <Link href="/merchant/create-program">
                        <Button>Create Program</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {["punch-card", "coupon-book"].map((type) => (
            <TabsContent key={type} value={type} className="mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPrograms
                  .filter((program) => program.type === type)
                  .map((program) => (
                    <EnhancedProgramCard
                      key={program.id}
                      program={program}
                      onInteract={handleProgramInteraction}
                      hasJoined={walletData?.publicAddress && program.participants?.includes(walletData.publicAddress)}
                      walletData={walletData}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </main>
  )
}