"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Gift, CreditCard, Star, MapPin, Calendar, ArrowRight } from "lucide-react"
import { loadPublicPrograms } from "@/lib/program-loader"
import type { MerchantProgram } from "@/lib/program-loader"

interface WalletData {
  publicAddress: string
  type: string
  privateKey?: string
  mnemonic?: string
  createdAt?: string
  updatedAt?: string
}

type PublicHomePageProps = {}

export default function PublicHomePage({}: PublicHomePageProps) {
  const [_walletData, setWalletData] = useState<WalletData | null>(null)
  const [programs, setPrograms] = useState<MerchantProgram[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<MerchantProgram[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Load wallet data from localStorage
  useEffect(() => {
    const loadWalletData = () => {
      setWalletData(null)
      return

      // TODO: In production, get wallet data from BSV session/authentication
      // For now, check localStorage locations

      // First check bsv-wallet-session
      const walletStr = localStorage.getItem("bsv-wallet-session")
      if (walletStr) {
        try {
          const data = JSON.parse(walletStr!)
          setWalletData({
            publicAddress: data.address || data.publicAddress,
            type: data.type,
            privateKey: data.privateKey,
            mnemonic: data.mnemonic,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          })
          console.log("🔥 Wallet data loaded from bsv-wallet-session:", data)
          return
        } catch (error) {
          console.error("Error parsing wallet data from bsv-wallet-session:", error)
        }
      }

      // Fallback to devWalletData
      const devWalletStr = localStorage.getItem("devWalletData")
      if (devWalletStr) {
        try {
          const data = JSON.parse(devWalletStr!)
          setWalletData({
            publicAddress: data.publicAddress || data.address,
            type: data.type,
            privateKey: data.privateKey,
            mnemonic: data.mnemonic,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          })
          console.log("🔥 Wallet data loaded from devWalletData:", data)
          return
        } catch (error) {
          console.error("Error parsing wallet data from devWalletData:", error)
        }
      }
    }

    loadWalletData()

    // Listen for wallet updates
    const handleWalletUpdate = () => loadWalletData()
    const handleLogout = () => setWalletData(null)

    window.addEventListener("walletUpdated", handleWalletUpdate)
    window.addEventListener("walletLogout", handleLogout)

    return () => {
      window.removeEventListener("walletUpdated", handleWalletUpdate)
      window.removeEventListener("walletLogout", handleLogout)
    }
  }, [])

  // Load all public programs from BSV
  useEffect(() => {
    const loadAllPrograms = async () => {
      setIsLoading(true)
      try {
        // Load all public programs from BSV blockchain
        const allPrograms = await loadPublicPrograms()

        // Filter only public programs
        const publicPrograms = allPrograms.filter(
          (program) => program.status === "active" && program.metadata?.privacy?.isPublic !== false,
        )

        setPrograms(publicPrograms)
        setFilteredPrograms(publicPrograms)
        console.log("📊 Loaded public programs:", publicPrograms)
      } catch (error) {
        console.error("Error loading programs:", error)
        setPrograms([])
        setFilteredPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    loadAllPrograms()
  }, [])

  // Filter programs based on search and type
  useEffect(() => {
    let filtered = programs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (program) =>
          program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (activeFilter !== "all") {
      filtered = filtered.filter((program) => {
        if (activeFilter === "punch-cards") return program.type === "punch-card"
        if (activeFilter === "coupon-books") return program.type === "coupon-book"
        return true
      })
    }

    setFilteredPrograms(filtered)
  }, [programs, searchTerm, activeFilter])

  // Calculate stats from actual program data
  const stats = {
    activePrograms: programs.length,
    punchCards: programs.filter((p) => p.type === "punch-card").length,
    couponBooks: programs.filter((p) => p.type === "coupon-book").length,
    participants: programs.reduce((total, program) => total + (program.totalParticipants || 0), 0),
  }

  const handleProgramClick = (programId: string) => {
    // Navigate to program details or join program
    window.location.href = `/programs/${programId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Loyalty Reimagined
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Empower your business with blockchain-based loyalty programs. Connect with customers, partner with local
            businesses, and grow your community.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.activePrograms}</div>
                <div className="text-sm text-blue-700">Active Programs</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.punchCards}</div>
                <div className="text-sm text-orange-700">Punch Cards</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.couponBooks}</div>
                <div className="text-sm text-green-700">Coupon Books</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.participants}</div>
                <div className="text-sm text-purple-700">Participants</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Users */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-2xl font-bold">For Users</h3>
              </div>
              <p className="text-gray-600 mb-6">Join loyalty programs and earn rewards</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Gift className="h-4 w-4 text-green-500 mr-2" />
                  <span>Manage all your rewards in one place</span>
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 text-green-500 mr-2" />
                  <span>Track your progress across programs</span>
                </li>
                <li className="flex items-center">
                  <CreditCard className="h-4 w-4 text-green-500 mr-2" />
                  <span>Redeem rewards easily</span>
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Card>

            {/* For Merchants */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-2xl font-bold">For Merchants</h3>
              </div>
              <p className="text-gray-600 mb-6">Create and manage loyalty programs</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Gift className="h-4 w-4 text-green-500 mr-2" />
                  <span>Create custom loyalty programs</span>
                </li>
                <li className="flex items-center">
                  <Users className="h-4 w-4 text-green-500 mr-2" />
                  <span>Track customer engagement</span>
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 text-green-500 mr-2" />
                  <span>Analyze program performance</span>
                </li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Create Program</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Programs Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Programs</h2>
            <Button variant="outline" className="flex items-center bg-transparent">
              View All Programs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
              >
                All Programs
              </Button>
              <Button
                variant={activeFilter === "punch-cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("punch-cards")}
              >
                Punch Cards
              </Button>
              <Button
                variant={activeFilter === "coupon-books" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("coupon-books")}
              >
                Coupon Books
              </Button>
            </div>
          </div>

          {/* Programs Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading programs from BSV blockchain...</p>
            </div>
          ) : filteredPrograms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card
                  key={program.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProgramClick(program.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      <Badge variant={program.type === "punch-card" ? "default" : "secondary"}>
                        {program.type === "punch-card" ? "Punch Card" : "Coupon Book"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{program.totalParticipants || 0} participants</span>
                      </div>
                      {program.metadata?.expirationDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Expires {new Date(program.metadata.expirationDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">By {program.merchantName || "Local Merchant"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Programs Available</h3>
              <p className="text-gray-500 mb-6">Be the first to create a loyalty program!</p>
              <Button className="bg-blue-600 hover:bg-blue-700">Create First Program</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}