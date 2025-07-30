"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  BarChart3,
  Globe,
} from "lucide-react"
import Link from "next/link"
import {
  type MerchantRecord,
  type MerchantQueryFilters,
  BusinessCategory,
  BusinessRegion,
  VerificationStatus,
  EmployeeRange,
  type MerchantAnalytics,
} from "./types"
import { queryMerchantsAction, getMerchantAnalyticsAction } from "./services/merchant-services"

export default function MerchantVerificationPage() {
  const [merchants, setMerchants] = useState<MerchantRecord[]>([])
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantRecord[]>([])
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<MerchantQueryFilters>({
    region: [],
    businessType: [],
    verificationStatus: [],
    employeeSize: [],
  })
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    loadMerchantData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [merchants, searchTerm, filters, activeTab])

  const loadMerchantData = async () => {
    try {
      setIsLoading(true)

      console.log("[Admin] Loading merchant data...")
      const [merchantData, analyticsData] = await Promise.all([
        queryMerchantsAction({}), // Get all merchants
        getMerchantAnalyticsAction({}), // Get analytics
      ])

      setMerchants(merchantData)
      setAnalytics(analyticsData)

      console.log(`[Admin] ✅ Loaded ${merchantData.length} merchants`)
      console.log("[Admin] Analytics:", analyticsData)
    } catch (error) {
      console.error("[Admin] Failed to load merchant data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = merchants

    // Filter by active tab (verification status)
    if (activeTab !== "all") {
      filtered = filtered.filter((merchant) => merchant.verification.status === activeTab)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (merchant) =>
          merchant.businessName.toLowerCase().includes(term) ||
          merchant.contact.applicantName.toLowerCase().includes(term) ||
          merchant.contact.email.toLowerCase().includes(term) ||
          merchant.location.city.toLowerCase().includes(term) ||
          merchant.location.state.toLowerCase().includes(term),
      )
    }

    // Apply region filter
    if (filters.region?.length) {
      filtered = filtered.filter((merchant) => filters.region!.includes(merchant.location.region))
    }

    // Apply business type filter
    if (filters.businessType?.length) {
      filtered = filtered.filter((merchant) => filters.businessType!.includes(merchant.businessType))
    }

    // Apply verification status filter
    if (filters.verificationStatus?.length) {
      filtered = filtered.filter((merchant) => filters.verificationStatus!.includes(merchant.verification.status))
    }

    // Apply employee size filter
    if (filters.employeeSize?.length) {
      filtered = filtered.filter(
        (merchant) =>
          merchant.businessDetails.employeeCount &&
          filters.employeeSize!.includes(merchant.businessDetails.employeeCount),
      )
    }

    setFilteredMerchants(filtered)
  }

  const updateFilters = (key: keyof MerchantQueryFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({
      region: [],
      businessType: [],
      verificationStatus: [],
      employeeSize: [],
    })
  }

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case VerificationStatus.UNDER_REVIEW:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case VerificationStatus.APPROVED:
        return "bg-green-100 text-green-800 border-green-200"
      case VerificationStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-200"
      case VerificationStatus.SUSPENDED:
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case VerificationStatus.UNDER_REVIEW:
        return <Eye className="h-4 w-4" />
      case VerificationStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case VerificationStatus.REJECTED:
        return <XCircle className="h-4 w-4" />
      case VerificationStatus.SUSPENDED:
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTabCount = (status: string) => {
    if (status === "all") return merchants.length
    return merchants.filter((merchant) => merchant.verification.status === status).length
  }

  const getDocumentCompletionPercentage = (documents: { businessLicense: any; identityVerification: any }) => {
    const total = 2 // Only 2 document types now
    const completed = [documents.businessLicense, documents.identityVerification].filter((doc) => doc.uploaded).length
    return Math.round((completed / total) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading merchant data...</p>
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Merchant Verification</h1>
            <p className="text-slate-600 text-lg">Database + BSV blockchain merchant management</p>
            {analytics && (
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span>📊 {analytics.totalMerchants} total merchants</span>
                <span>🌍 {Object.keys(analytics.byRegion).length} regions</span>
                <span>🏢 {Object.keys(analytics.byBusinessType).length} business types</span>
                <span>⚡ {analytics.averageProcessingTime} days avg processing</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={loadMerchantData} variant="outline" size="lg" className="gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="lg">
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">By Region</CardTitle>
                <Globe className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(analytics.byRegion)
                    .filter(([_, count]) => count > 0)
                    .slice(0, 3)
                    .map(([region, count]) => (
                      <div key={region} className="flex justify-between text-sm">
                        <span className="capitalize">{region.replace("_", " ")}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">By Business Type</CardTitle>
                <Building className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(analytics.byBusinessType)
                    .filter(([_, count]) => count > 0)
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace("_", " ")}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Top Cities</CardTitle>
                <MapPin className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {analytics.topCities.slice(0, 3).map(({ city, count }) => (
                    <div key={city} className="flex justify-between text-sm">
                      <span>{city}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{analytics.conversionRate}%</div>
                <p className="text-xs text-slate-500 mt-1">Submitted to approved</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Merchant Filters
            </CardTitle>
            <CardDescription>Filter merchants by region, business type, and other criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search merchants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.region?.[0] || "all"}
                onValueChange={(value) => updateFilters("region", value === "all" ? [] : [value as BusinessRegion])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {Object.values(BusinessRegion).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.businessType?.[0] || "all"}
                onValueChange={(value) =>
                  updateFilters("businessType", value === "all" ? [] : [value as BusinessCategory])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Types</SelectItem>
                  {Object.values(BusinessCategory).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.employeeSize?.[0] || "all"}
                onValueChange={(value) =>
                  updateFilters("employeeSize", value === "all" ? [] : [value as EmployeeRange])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {Object.values(EmployeeRange).map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Applications */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Merchant Applications</CardTitle>
            <CardDescription>
              Showing {filteredMerchants.length} of {merchants.length} merchants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({getTabCount("all")})</TabsTrigger>
                <TabsTrigger value="pending">
                  <Clock className="h-4 w-4 mr-1" />
                  Pending ({getTabCount(VerificationStatus.PENDING)})
                </TabsTrigger>
                <TabsTrigger value="under_review">
                  <Eye className="h-4 w-4 mr-1" />
                  Review ({getTabCount(VerificationStatus.UNDER_REVIEW)})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approved ({getTabCount(VerificationStatus.APPROVED)})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejected ({getTabCount(VerificationStatus.REJECTED)})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredMerchants.map((merchant) => (
                    <Card key={merchant.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-900">{merchant.businessName}</h3>
                              <Badge className={getStatusColor(merchant.verification.status)}>
                                {getStatusIcon(merchant.verification.status)}
                                <span className="ml-1">{merchant.verification.status.replace("_", " ")}</span>
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {merchant.businessType.replace("_", " ")}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {merchant.location.region.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{merchant.contact.applicantName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{merchant.contact.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{merchant.contact.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{merchant.businessDetails.employeeCount} employees</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {merchant.location.city}, {merchant.location.state}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-slate-900">
                                Documents: {getDocumentCompletionPercentage(merchant.documents)}%
                              </div>
                              <div className="text-xs text-slate-500">ID: {merchant.id}</div>
                              <div className="text-xs text-slate-500">
                                BSV: {merchant.businessDataHash.substring(0, 12)}...
                              </div>
                            </div>
                            <Link href={`/admin/merchant-verification/${merchant.id}`}>
                              <Button size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Review
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Document Status */}
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-medium text-slate-700">Documents:</span>
                          <div className="flex gap-2">
                            <Badge
                              variant={merchant.documents.businessLicense.uploaded ? "default" : "secondary"}
                              className={
                                merchant.documents.businessLicense.verified ? "bg-green-100 text-green-800" : ""
                              }
                            >
                              Business License
                              {merchant.documents.businessLicense.verified && " ✓"}
                            </Badge>
                            <Badge
                              variant={merchant.documents.identityVerification.uploaded ? "default" : "secondary"}
                              className={
                                merchant.documents.identityVerification.verified ? "bg-green-100 text-green-800" : ""
                              }
                            >
                              Identity Verification
                              {merchant.documents.identityVerification.verified && " ✓"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredMerchants.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No merchants found</h3>
                      <p className="text-slate-600">Try adjusting your filters or search terms</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}