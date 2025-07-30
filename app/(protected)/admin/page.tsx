"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Store, CheckCircle, Clock, AlertTriangle, TrendingUp, Shield, Settings, FileText } from "lucide-react"
import Link from "next/link"

interface AdminStats {
  totalMerchants: number
  pendingVerifications: number
  totalCustomers: number
  activePrograms: number
  totalTransactions: number
  revenueThisMonth: number
}

interface PendingVerification {
  id: string
  businessName: string
  applicantName: string
  submittedAt: string
  status: "pending" | "under_review" | "approved" | "rejected"
  priority: "high" | "medium" | "low"
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalMerchants: 0,
    pendingVerifications: 0,
    totalCustomers: 0,
    activePrograms: 0,
    totalTransactions: 0,
    revenueThisMonth: 0,
  })

  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      // Mock data - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalMerchants: 156,
        pendingVerifications: 12,
        totalCustomers: 2847,
        activePrograms: 89,
        totalTransactions: 15420,
        revenueThisMonth: 45230,
      })

      setPendingVerifications([
        {
          id: "ver_001",
          businessName: "Coffee Corner Cafe",
          applicantName: "Sarah Johnson",
          submittedAt: "2024-01-15T10:30:00Z",
          status: "pending",
          priority: "high",
        },
        {
          id: "ver_002",
          businessName: "Downtown Bakery",
          applicantName: "Mike Chen",
          submittedAt: "2024-01-14T14:20:00Z",
          status: "under_review",
          priority: "medium",
        },
        {
          id: "ver_003",
          businessName: "Tech Repair Shop",
          applicantName: "Alex Rodriguez",
          submittedAt: "2024-01-13T09:15:00Z",
          status: "pending",
          priority: "low",
        },
      ])
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admin dashboard...</p>
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600 text-lg">Manage merchants, verifications, and platform operations</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Merchants</CardTitle>
              <Store className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalMerchants}</div>
              <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Verifications</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.pendingVerifications}</div>
              <p className="text-xs text-slate-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalCustomers.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">+8% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Programs</CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.activePrograms}</div>
              <p className="text-xs text-slate-500 mt-1">Across all merchants</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Transactions</CardTitle>
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${stats.revenueThisMonth.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Merchant Verification */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Merchant Verification
                  </CardTitle>
                  <CardDescription>Review and approve merchant applications</CardDescription>
                </div>
                <Link href="/admin/merchant-verification">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVerifications.slice(0, 3).map((verification) => (
                  <div key={verification.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">{verification.businessName}</h4>
                        <Badge className={getPriorityColor(verification.priority)}>{verification.priority}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">by {verification.applicantName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(verification.status)}>
                        {verification.status.replace("_", " ")}
                      </Badge>
                      <Link href={`/admin/merchant-verification/${verification.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {pendingVerifications.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>No pending verifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                System Health
              </CardTitle>
              <CardDescription>Platform status and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">BSV Blockchain</p>
                      <p className="text-sm text-green-700">All systems operational</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Database</p>
                      <p className="text-sm text-green-700">Response time: 45ms</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Verification Queue</p>
                      <p className="text-sm text-yellow-700">12 applications pending</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Quick access to common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/merchant-verification">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Merchant Verification</span>
                </Button>
              </Link>

              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>User Management</span>
              </Button>

              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Program Management</span>
              </Button>

              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Settings className="h-6 w-6" />
                <span>System Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}