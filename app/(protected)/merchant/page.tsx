"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Calendar,
  Tag,
  Coffee,
  Store,
  Gift,
  RefreshCw,
  PlusCircle,
  Search,
  BarChart3,
  Settings,
  Building2,
  MapPin,
  Phone,
  FileText,
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
  AirplayIcon as Broadcast,
  Edit3,
  Shield,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { saveBusinessProfile, refreshMerchantData } from "./profile-actions"
import { loadMerchantPrograms, type MerchantProgram } from "@/lib/program-loader"

interface BusinessProfile {
  businessName: string
  industry: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  website: string
  taxId: string
  businessLicense: string
}

interface WalletData {
  publicAddress: string
  type: "merchant"
}

const INDUSTRIES = [
  "Restaurant & Food Service",
  "Retail & Shopping",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Automotive",
  "Professional Services",
  "Entertainment & Recreation",
  "Education",
  "Technology",
  "Real Estate",
  "Financial Services",
  "Other",
]

export default function MerchantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)
  const [broadcastError, setBroadcastError] = useState("")
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [lastTransactionId, setLastTransactionId] = useState<string>("")
  const [broadcastToBSV, setBroadcastToBSV] = useState(false)
  const [programCreatedSuccess, setProgramCreatedSuccess] = useState(false)

  // Profile state - loaded from BSV blockchain
  const [blockchainProfile, setBlockchainProfile] = useState<BusinessProfile>({
    businessName: "",
    industry: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    businessLicense: "",
  })

  // Current editing state (may differ from blockchain)
  const [currentProfile, setCurrentProfile] = useState<BusinessProfile>({
    businessName: "",
    industry: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    businessLicense: "",
  })

  // Programs State - loaded from BSV blockchain via program-loader
  const [programs, setPrograms] = useState<MerchantProgram[]>([])

  useEffect(() => {
    loadMerchantData()
  }, [])

  // Check for program creation success
  useEffect(() => {
    const created = searchParams.get("created")
    if (created === "true") {
      setProgramCreatedSuccess(true)
      // Clear the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete("created")
      window.history.replaceState({}, "", url.toString())

      // Auto-hide success message and refresh programs
      setTimeout(() => {
        setProgramCreatedSuccess(false)
        if (walletData) {
          loadMerchantPrograms(walletData.publicAddress).then(setPrograms)
        }
      }, 2000)
    }
  }, [searchParams, walletData])

  // Load local profile from localStorage (for draft editing)
  const loadLocalProfile = (walletAddress: string): BusinessProfile | null => {
    try {
      const localProfileKey = `merchant-profile-${walletAddress}`
      const localProfileData = localStorage.getItem(localProfileKey)

      if (localProfileData) {
        const localProfile = JSON.parse(localProfileData)
        console.log("[Merchant] Loaded local profile draft from localStorage")
        return localProfile
      }

      console.log("[Merchant] No local profile draft found")
      return null
    } catch (error) {
      console.error("[Merchant] Error loading local profile draft:", error)
      return null
    }
  }

  // Save profile draft to localStorage
  const saveLocalProfile = (walletAddress: string, profile: BusinessProfile) => {
    try {
      const localProfileKey = `merchant-profile-${walletAddress}`
      localStorage.setItem(localProfileKey, JSON.stringify(profile))
      console.log("[Merchant] Saved profile draft to localStorage")
    } catch (error) {
      console.error("[Merchant] Error saving profile draft:", error)
    }
  }

  const loadMerchantData = async () => {
    try {
      setIsLoading(true)
      console.log("[Merchant] Starting merchant data load...")

      // Check localStorage for wallet session first (faster than BSV call)
      const sessionData = localStorage.getItem("bsv-wallet-session")
      if (!sessionData) {
        console.log("[Merchant] No wallet session found - redirecting to wallet generation")
        router.push("/wallet-generation")
        return
      }

      let walletSession
      try {
        walletSession = JSON.parse(sessionData)
        console.log("[Merchant] Parsed wallet session:", walletSession)
      } catch (error) {
        console.error("[Merchant] Invalid wallet session data - redirecting to wallet generation")
        localStorage.removeItem("bsv-wallet-session")
        router.push("/wallet-generation")
        return
      }

      // Ensure this is a merchant wallet
      if (walletSession.type !== "merchant") {
        console.log("[Merchant] Non-merchant wallet detected - redirecting to customer dashboard")
        router.push("/customer")
        return
      }

      // Convert to expected format
      const walletData = {
        publicAddress: walletSession.address,
        type: walletSession.type as "merchant",
      }

      setWalletData(walletData)
      console.log(`[Merchant] ✅ Merchant wallet connected: ${walletSession.address}`)

      // Load local profile draft first (immediate)
      const localProfile = loadLocalProfile(walletSession.address)

      // Load merchant data from BSV blockchain using program-loader
      try {
        console.log("[Merchant] Loading merchant data from BSV blockchain...")

        // Load programs using the BSV program loader
        const bsvPrograms = await loadMerchantPrograms(walletSession.address)
        setPrograms(bsvPrograms)
        console.log(`[Merchant] ✅ Loaded ${bsvPrograms.length} programs from BSV blockchain`)

        // Load profile from BSV blockchain
        const merchantData = await refreshMerchantData(walletSession.address)

        if (merchantData.profile) {
          setBlockchainProfile(merchantData.profile)
          // Only update current profile if no local draft exists
          if (!localProfile) {
            setCurrentProfile(merchantData.profile)
          } else {
            setCurrentProfile(localProfile)
          }
          console.log("[Merchant] ✅ Loaded existing profile from blockchain")
        } else {
          console.log("[Merchant] No existing profile found on blockchain")
          if (localProfile) {
            setCurrentProfile(localProfile)
          }
        }
      } catch (error) {
        console.error("[Merchant] Error loading merchant data from blockchain:", error)
        // Continue with local data only
        if (localProfile) {
          setCurrentProfile(localProfile)
        }
        console.log("[Merchant] Continuing with local data only due to blockchain error")
      }
    } catch (error) {
      console.error("[Merchant] Error loading merchant data:", error)
      // On critical error, redirect to wallet generation
      router.push("/wallet-generation")
    } finally {
      setIsLoading(false)
      console.log("[Merchant] ✅ Merchant data load complete")
    }
  }

  // Check if current profile differs from blockchain
  const hasUnsavedChanges = JSON.stringify(currentProfile) !== JSON.stringify(blockchainProfile)

  // Updated validation logic - more permissive for local functionality
  const hasBasicInfo = currentProfile.businessName.trim() !== "" // Only business name required for basic functionality
  const hasCompleteProfile = hasBasicInfo && currentProfile.industry.trim() !== ""
  const hasTaxId = currentProfile.taxId.trim() !== ""
  const canGetVerified = hasCompleteProfile && hasTaxId // Full verification requires complete profile + tax ID
  const isProfileBroadcasted =
    JSON.stringify(currentProfile) === JSON.stringify(blockchainProfile) && blockchainProfile.businessName !== ""

  const handleProfileChange = (field: keyof BusinessProfile, value: string) => {
    const updatedProfile = { ...currentProfile, [field]: value }
    setCurrentProfile(updatedProfile)

    // Auto-save draft to localStorage
    if (walletData) {
      saveLocalProfile(walletData.publicAddress, updatedProfile)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setBroadcastError("")
    setBroadcastSuccess(false)

    if (!currentProfile.businessName.trim()) {
      setBroadcastError("Business name is required")
      return
    }

    if (!walletData) {
      setBroadcastError("Wallet not connected")
      return
    }

    // Always save locally first
    saveLocalProfile(walletData.publicAddress, currentProfile)

    if (!broadcastToBSV) {
      // Just save as draft (localStorage only)
      setBroadcastSuccess(true)
      setTimeout(() => setBroadcastSuccess(false), 2000)
      return
    }

    // Validate for blockchain broadcast
    if (!hasCompleteProfile) {
      setBroadcastError("Business name and industry are required for blockchain broadcast")
      return
    }

    try {
      setIsBroadcasting(true)

      // Broadcast profile to BSV blockchain
      const result = await saveBusinessProfile(currentProfile, walletData.publicAddress)

      if (result.success) {
        setLastTransactionId(result.transactionId)
        setBlockchainProfile(currentProfile) // Update blockchain state
        setBroadcastSuccess(true)
        console.log(`✅ Profile broadcasted to BSV blockchain: ${result.transactionId}`)

        // Clear local draft since it's now on blockchain
        localStorage.removeItem(`merchant-profile-${walletData.publicAddress}`)

        // Auto-hide success message after 3 seconds
        setTimeout(() => setBroadcastSuccess(false), 3000)
      }
    } catch (error) {
      console.error("[BSV] Error broadcasting profile:", error)
      setBroadcastError("Failed to broadcast profile to BSV blockchain. Please try again.")
    } finally {
      setIsBroadcasting(false)
    }
  }

  const handleRefreshData = async () => {
    if (!walletData) return
    await loadMerchantData()
  }

  const handleResetToDraft = () => {
    setCurrentProfile(blockchainProfile)
    if (walletData) {
      // Clear local draft
      localStorage.removeItem(`merchant-profile-${walletData.publicAddress}`)
    }
  }

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    totalPrograms: programs.length,
    activePrograms: programs.filter((p) => p.isActive).length,
    totalParticipants: programs.reduce((sum, p) => sum + p.totalParticipants, 0),
    totalRewards: 0,
  }

  // Show loading while checking wallet status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading merchant dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no wallet data at this point, something went wrong (should have redirected)
  if (!walletData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">You need a connected BSV merchant wallet to access this dashboard.</p>
              <Button onClick={() => router.push("/wallet-generation")} size="lg">
                Connect BSV Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Merchant Dashboard</h1>
            <p className="text-slate-600 text-lg">Manage your loyalty programs and track customer engagement</p>
            {currentProfile.businessName && (
              <div className="mt-3 flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {currentProfile.businessName}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    Draft Changes
                  </Badge>
                )}
                {isProfileBroadcasted && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {lastTransactionId && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    BSV: {lastTransactionId.slice(-8)}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefreshData} variant="outline" size="lg" className="gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button asChild size="lg" className="gap-2">
              <Link href="/merchant/create-program">
                <PlusCircle className="h-4 w-4" />
                Create Program
              </Link>
            </Button>
          </div>
        </div>

        {/* Program Created Success */}
        {programCreatedSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Program created successfully!</strong> Your new loyalty program has been saved to the BSV
              blockchain.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Alerts */}
        {!hasBasicInfo && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Add your business name</strong> to get started with creating loyalty programs.{" "}
              <button onClick={() => setActiveTab("profile")} className="underline hover:no-underline font-medium">
                Add now →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {hasBasicInfo && !canGetVerified && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Complete your profile for verification</strong> - Add industry and tax ID to become a verified
              merchant.{" "}
              <button onClick={() => setActiveTab("profile")} className="underline hover:no-underline font-medium">
                Complete profile →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>You have unsaved changes</strong> - Your edits are saved locally but not broadcasted to BSV
              blockchain.{" "}
              <button onClick={() => setActiveTab("profile")} className="underline hover:no-underline font-medium">
                Review and broadcast →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">
              Business Profile
              {hasUnsavedChanges && <span className="ml-1 w-2 h-2 bg-amber-500 rounded-full"></span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Programs</CardTitle>
                  <Store className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.totalPrograms}</div>
                  <p className="text-xs text-slate-500 mt-1">{stats.activePrograms} active programs</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Participants</CardTitle>
                  <Users className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.totalParticipants}</div>
                  <p className="text-xs text-slate-500 mt-1">Across all programs</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Rewards Redeemed</CardTitle>
                  <Gift className="h-5 w-5 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.totalRewards}</div>
                  <p className="text-xs text-slate-500 mt-1">Total claimed</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Verification Status</CardTitle>
                  <Building2 className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900">
                    {isProfileBroadcasted ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : canGetVerified ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isProfileBroadcasted
                      ? "Verified on BSV"
                      : canGetVerified
                        ? "Ready for verification"
                        : "Complete profile"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Programs Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Recent Programs</h2>

              {programs.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Store className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Programs Created Yet</h3>
                    <p className="text-slate-600 text-center mb-6 max-w-md">
                      Start building customer loyalty by creating your first program. Programs are saved directly to the
                      BSV blockchain.
                    </p>
                    <Button asChild size="lg">
                      <Link href="/merchant/create-program">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Your First Program
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {programs.slice(0, 6).map((program) => (
                    <Card key={program.id} className="border-0 shadow-lg bg-white/80 backdrop-blur">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                program.type === "punch-card" ? "bg-amber-100" : "bg-green-100"
                              }`}
                            >
                              {program.type === "punch-card" ? (
                                <Coffee className="h-5 w-5 text-amber-600" />
                              ) : (
                                <Tag className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{program.name}</CardTitle>
                              <CardDescription>{program.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={program.isActive ? "default" : "secondary"}
                              className={program.isActive ? "bg-green-100 text-green-800" : ""}
                            >
                              {program.isActive ? "active" : "inactive"}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-600">
                              <Globe className="h-3 w-3 mr-1" />
                              BSV
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{program.totalParticipants} participants</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Link href={`/merchant/programs/${program.id}`}>View Details</Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="programs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-900">All Programs</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button asChild>
                  <Link href="/merchant/create-program">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Program
                  </Link>
                </Button>
              </div>
            </div>

            {filteredPrograms.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {searchTerm ? "No programs found" : "No programs created yet"}
                  </h3>
                  <p className="text-slate-600 text-center mb-6 max-w-md">
                    {searchTerm
                      ? "Try adjusting your search terms or create a new program."
                      : "Start building customer loyalty by creating your first program."}
                  </p>
                  <Button asChild size="lg">
                    <Link href="/merchant/create-program">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Program
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPrograms.map((program) => (
                  <Card key={program.id} className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              program.type === "punch-card" ? "bg-amber-100" : "bg-green-100"
                            }`}
                          >
                            {program.type === "punch-card" ? (
                              <Coffee className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Tag className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{program.name}</CardTitle>
                            <CardDescription>{program.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={program.isActive ? "default" : "secondary"}
                            className={program.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {program.isActive ? "active" : "inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            BSV
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{program.totalParticipants} participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Link href={`/merchant/programs/${program.id}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>Detailed insights into your loyalty programs</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-slate-600 mb-4">
                    Detailed analytics and insights will be available in the next update.
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            {broadcastSuccess && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>{broadcastToBSV ? "Profile Broadcasted!" : "Profile Saved!"}</strong>{" "}
                  {broadcastToBSV
                    ? "Your business profile has been saved to the BSV blockchain and you are now verified."
                    : "Your profile changes are saved locally."}
                  {lastTransactionId && <span className="block text-xs mt-1">Transaction ID: {lastTransactionId}</span>}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                      <CardDescription>Essential details about your business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessName">Business Name *</Label>
                          <Input
                            id="businessName"
                            value={currentProfile.businessName}
                            onChange={(e) => handleProfileChange("businessName", e.target.value)}
                            placeholder="Your Business Name"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">Required to create programs</p>
                        </div>
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={currentProfile.industry}
                            onValueChange={(value) => handleProfileChange("industry", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">Required for verification</p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                          id="description"
                          value={currentProfile.description}
                          onChange={(e) => handleProfileChange("description", e.target.value)}
                          placeholder="Describe your business and what makes it special..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Business Address
                      </CardTitle>
                      <CardDescription>Physical location of your business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={currentProfile.address}
                          onChange={(e) => handleProfileChange("address", e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={currentProfile.city}
                            onChange={(e) => handleProfileChange("city", e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={currentProfile.state}
                            onChange={(e) => handleProfileChange("state", e.target.value)}
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={currentProfile.zipCode}
                            onChange={(e) => handleProfileChange("zipCode", e.target.value)}
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                      <CardDescription>How customers can reach you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={currentProfile.phone}
                            onChange={(e) => handleProfileChange("phone", e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={currentProfile.email}
                            onChange={(e) => handleProfileChange("email", e.target.value)}
                            placeholder="business@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="website">Website (optional)</Label>
                        <Input
                          id="website"
                          value={currentProfile.website}
                          onChange={(e) => handleProfileChange("website", e.target.value)}
                          placeholder="https://www.yourbusiness.com"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Legal Information */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Legal Information
                      </CardTitle>
                      <CardDescription>
                        Business registration and tax details (Tax ID required for merchant verification)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxId">Tax ID / EIN</Label>
                          <Input
                            id="taxId"
                            value={currentProfile.taxId}
                            onChange={(e) => handleProfileChange("taxId", e.target.value)}
                            placeholder="12-3456789"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Required for merchant verification</p>
                        </div>
                        <div>
                          <Label htmlFor="businessLicense">Business License</Label>
                          <Input
                            id="businessLicense"
                            value={currentProfile.businessLicense}
                            onChange={(e) => handleProfileChange("businessLicense", e.target.value)}
                            placeholder="License Number"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Requirements Status */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Status</CardTitle>
                      <CardDescription>Track your profile completion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        {hasBasicInfo ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-sm">Basic Info (Create Programs)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasCompleteProfile ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-sm">Complete Profile (Broadcast)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {canGetVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-sm">Verification Ready</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isProfileBroadcasted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-sm">BSV Verified</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Draft Status */}
                  {hasUnsavedChanges && (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur border-amber-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-800">Local Changes</CardTitle>
                        <CardDescription>Changes saved locally</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-amber-700">
                            Your changes are saved locally but not yet broadcasted to the BSV blockchain.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetToDraft}
                            className="w-full bg-transparent"
                          >
                            Reset to Blockchain Version
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* BSV Broadcast Toggle */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">Save Options</CardTitle>
                      <CardDescription>Choose how to save your changes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="broadcast-toggle" checked={broadcastToBSV} onCheckedChange={setBroadcastToBSV} />
                        <div className="space-y-1">
                          <Label htmlFor="broadcast-toggle" className="text-sm font-medium">
                            Broadcast to BSV Blockchain
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {broadcastToBSV
                              ? "Will create a BSV transaction for verification"
                              : "Will save locally only"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <strong>Local:</strong> Changes saved to your device, programs work immediately
                        </p>
                        <p>
                          <strong>Broadcast:</strong> Permanent BSV blockchain verification
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* BSV Status */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">Connection Status</CardTitle>
                      <CardDescription>Your wallet and network status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Merchant Wallet Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>BSV Network Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Program Loader Active</span>
                        </div>
                        {lastTransactionId && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                            <strong>Last TX:</strong> {lastTransactionId}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isBroadcasting || !currentProfile.businessName.trim()}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isBroadcasting ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Broadcasting to BSV...
                      </>
                    ) : broadcastToBSV ? (
                      <>
                        <Broadcast className="w-4 h-4 mr-2" />
                        Broadcast to BSV Blockchain
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Locally
                      </>
                    )}
                  </Button>

                  {broadcastError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{broadcastError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}