"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import type { WalletData } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Store, Ticket, Gift, Trophy, Users, ShoppingBag, ArrowRight, Search } from "lucide-react"
import { getWalletData } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { ProgramCard } from "@/components/program-card"
import { debug } from "@/lib/debug"
import { DebugCoupons } from "@/components/debug-coupons"
import { safeNavigate } from "@/lib/navigation-utils"
import {
  getCouponPrograms,
  createManualCoupon,
  getDirectProgramsFromStorage,
  ensureDefaultCoupons,
  hasUserWallet,
} from "@/lib/direct-storage-access"

// Add this import at the top of the file
import { syncProgramsAndCoupons } from "@/lib/coupon-sync"

// Environment variable to control debug mode
const SHOW_DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === "true"

interface UserType {
  type: "user" | "merchant"
  wallet: WalletData | null
}

interface CouponProgram {
  id: string
  name: string
  description: string
  merchantName: string
  merchantAddress: string
  discount: string
  expirationDate: string | Date
  image?: string
}

// Convert a program to a coupon format
function programToCoupon(program: any): CouponProgram {
  // Extract discount information
  let discount = "Special offer"
  if (program.discount) {
    discount = program.discount
  } else if (program.metadata?.discountAmount && program.metadata?.discountType) {
    discount =
      program.metadata.discountType === "percentage"
        ? `${program.metadata.discountAmount}% off`
        : `$${program.metadata.discountAmount} off`
  }

  // Extract merchant name
  const merchantName =
    program.metadata?.merchantName ||
    program.metadata?.merchant ||
    program.merchantName ||
    (program.merchantAddress
      ? program.merchantAddress.substring(0, 6) +
        "..." +
        program.merchantAddress.substring(program.merchantAddress.length - 4)
      : "Unknown Merchant")

  // Extract expiration date - properly handle the date format
  let expirationDate: Date
  if (program.expirationDate) {
    expirationDate = new Date(program.expirationDate)
  } else if (program.metadata?.expirationDate) {
    expirationDate = new Date(program.metadata.expirationDate)
  } else {
    expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  return {
    id: program.id,
    name: program.name,
    description: program.description || "",
    merchantName,
    merchantAddress: program.merchantAddress,
    discount,
    expirationDate,
    image: program.metadata?.image || "/placeholder.svg?height=100&width=200",
  }
}

export default function Home() {
  const [userData, setUserData] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("featured")
  const [programs, setPrograms] = useState<any[]>([])
  const [coupons, setCoupons] = useState<CouponProgram[]>([])
  const [debugMessage, setDebugMessage] = useState<string | null>(null)
  const [clippedCoupons, setClippedCoupons] = useState<string[]>([])

  // Function to load coupons
  const loadCoupons = useCallback(() => {
    try {
      // Get coupon programs
      const couponPrograms = getCouponPrograms()
      debug("Coupon programs:", couponPrograms.length)

      // If no coupons found, add a default one
      if (couponPrograms.length === 0) {
        const added = ensureDefaultCoupons()
        if (added) {
          // Try again after adding default coupon
          const updatedPrograms = getCouponPrograms()
          if (updatedPrograms.length > 0) {
            const couponItems = updatedPrograms.map(programToCoupon)
            setCoupons(couponItems)
            return
          }
        }

        // If still no coupons, create a manual one just for display
        const manualCoupon = createManualCoupon()
        const couponItem = programToCoupon(manualCoupon)
        setCoupons([couponItem])

        if (SHOW_DEBUG) {
          setDebugMessage("No coupons found in storage, added manual coupon")
        }
      } else {
        // Convert to coupon format
        const couponItems = couponPrograms.map(programToCoupon)
        setCoupons(couponItems)
      }
    } catch (error) {
      console.error("Error loading coupons:", error)

      // Add manual coupon as fallback
      const manualCoupon = createManualCoupon()
      const couponItem = programToCoupon(manualCoupon)
      setCoupons([couponItem])

      if (SHOW_DEBUG) {
        setDebugMessage("Error loading coupons, added manual coupon as fallback")
      }
    }
  }, [])

  // Function to load clipped coupons
  const loadClippedCoupons = useCallback(() => {
    if (!userData?.wallet?.publicAddress) return

    try {
      const userCouponsKey = `user-coupons-${userData.wallet.publicAddress}`
      const couponsStr = localStorage.getItem(userCouponsKey) || "[]"
      const userCoupons = JSON.parse(couponsStr)

      console.log("Loaded clipped coupons:", userCoupons.length)

      // Extract just the IDs for easy checking
      const couponIds = userCoupons.map((c: any) => c.id)
      setClippedCoupons(couponIds)
    } catch (error) {
      console.error("Error loading clipped coupons:", error)
      setClippedCoupons([])
    }
  }, [userData?.wallet?.publicAddress])

  // Then in the useEffect where you load data, add this:
  useEffect(() => {
    const loadData = async () => {
      try {
        // Synchronize programs and coupons to ensure consistency
        syncProgramsAndCoupons()

        // Ensure we have default coupons
        ensureDefaultCoupons()

        // Load wallet data
        const walletData = await getWalletData()
        if (walletData?.type) {
          setUserData({
            type: walletData.type,
            wallet: walletData,
          })
        } else {
          setUserData(null)
        }

        // Load programs
        const allPrograms = getDirectProgramsFromStorage()
        debug("All programs:", allPrograms.length)
        setPrograms(allPrograms)

        // Load coupons
        loadCoupons()
      } catch (error) {
        console.error("Error loading data:", error)
        setUserData(null)
        setPrograms([])

        // Add manual coupon as fallback
        const manualCoupon = createManualCoupon()
        const couponItem = programToCoupon(manualCoupon)
        setCoupons([couponItem])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Listen for the custom couponFound event
    const handleCouponFound = (event: CustomEvent) => {
      const { coupon } = event.detail
      debug("Coupon found event received:", coupon)

      // Convert to coupon format and add to state
      const couponItem = programToCoupon(coupon)
      setCoupons((prev) => {
        // Check if this coupon is already in the state
        const exists = prev.some((c) => c.id === couponItem.id)
        if (exists) {
          return prev
        }
        return [...prev, couponItem]
      })
    }

    window.addEventListener("couponFound", handleCouponFound as EventListener)

    return () => {
      window.removeEventListener("couponFound", handleCouponFound as EventListener)
    }
  }, [loadCoupons])

  // Load clipped coupons when userData changes
  useEffect(() => {
    if (userData?.wallet?.publicAddress) {
      loadClippedCoupons()
    }
  }, [userData, loadClippedCoupons])

  // Function to check if a coupon is already clipped
  const isAlreadyClipped = (couponId: string) => {
    return clippedCoupons.includes(couponId)
  }

  // Filter coupons based on search term
  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase()),
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
            <Link href={userData?.type === "user" ? "/user" : "/wallet-generation"}>
              <Button className="w-full">{userData?.type === "user" ? "View Dashboard" : "Get Started"}</Button>
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
            <Link href={userData?.type === "merchant" ? "/(protected)/merchant" : "/wallet-generation"}>
              <Button className="w-full">
                {userData?.type === "merchant" ? "Merchant Dashboard" : "Create Program"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Programs and Coupons Section */}
      <section className="mb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="featured">Featured Programs</TabsTrigger>
            <TabsTrigger value="couponBook">Coupon Book</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-0">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Programs</h2>
              <Link href="/programs">
                <Button variant="outline" className="gap-2">
                  View All Programs
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="all">All Programs</TabsTrigger>
                <TabsTrigger value="punch-card">Punch Cards</TabsTrigger>
                <TabsTrigger value="coupon-book">Coupon Books</TabsTrigger>
                <TabsTrigger value="points">Points Programs</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.length > 0 ? (
                      programs.map((program) => (
                        <ProgramCard
                          key={program.id}
                          program={program}
                          userType={userData?.type || null}
                          userWalletAddress={userData?.wallet?.publicAddress || null}
                          onJoin={() => {
                            if (!userData) {
                              safeNavigate("/wallet-generation")
                            }
                            // Handle join program logic here
                          }}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-12">
                        <p className="text-muted-foreground">No active programs found.</p>
                        {userData?.type === "merchant" && (
                          <Button className="mt-4" onClick={() => safeNavigate("/(protected)/merchant/create-program")}>
                            Create Your First Program
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {["punch-card", "coupon-book", "points"].map((type) => (
                <TabsContent key={type} value={type} className="mt-0">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {programs
                        .filter((program) => program.type === type)
                        .map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            userType={userData?.type || null}
                            userWalletAddress={userData?.wallet?.publicAddress || null}
                            onJoin={() => {
                              if (!userData) {
                                safeNavigate("/wallet-generation")
                              }
                              // Handle join program logic here
                            }}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="couponBook" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Book</CardTitle>
                <CardDescription>Browse and clip coupons from various merchants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search coupons or merchants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Debug information - only show in debug mode */}
                {SHOW_DEBUG && (
                  <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-md">
                    <p>Found {coupons.length} coupons in storage</p>
                    <p>Clipped coupons: {clippedCoupons.join(", ")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        ensureDefaultCoupons()
                        loadCoupons()
                        loadClippedCoupons()
                      }}
                    >
                      Refresh Coupons
                    </Button>
                  </div>
                )}

                {filteredCoupons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCoupons.map((coupon) => (
                      <Card key={coupon.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{coupon.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-primary">{coupon.discount}</span>
                            <span className="text-sm text-muted-foreground">
                              Expires: {new Date(coupon.expirationDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium">Merchant: {coupon.merchantName}</p>
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={() => {
                              if (!userData) {
                                safeNavigate("/wallet-generation")
                                return
                              }

                              if (userData.type === "user" && userData.wallet) {
                                try {
                                  // Dispatch a custom event to notify that a coupon was clipped
                                  const clipEvent = new CustomEvent("couponClipped", {
                                    detail: {
                                      couponId: coupon.id,
                                      userId: userData.wallet.publicAddress,
                                      merchantAddress: coupon.merchantAddress,
                                    },
                                  })
                                  window.dispatchEvent(clipEvent)

                                  // Update local state to reflect the clipped coupon
                                  setClippedCoupons((prev) => [...prev, coupon.id])

                                  // Show feedback to the user
                                  alert(`Coupon "${coupon.name}" has been clipped and added to your wallet!`)

                                  // Redirect to user dashboard
                                  safeNavigate("/user", { timeout: 500 })
                                } catch (error) {
                                  console.error("Error clipping coupon:", error)
                                  alert("There was an error clipping this coupon. Please try again.")
                                }
                              }
                            }}
                            disabled={userData?.type === "merchant" || isAlreadyClipped(coupon.id)}
                          >
                            {userData?.type === "merchant"
                              ? "Merchants Cannot Clip"
                              : isAlreadyClipped(coupon.id)
                                ? "Already Clipped"
                                : userData
                                  ? "Clip Coupon"
                                  : hasUserWallet()
                                    ? "Clip Coupon"
                                    : "Create Wallet to Clip"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No coupons available at this time.</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        ensureDefaultCoupons()
                        loadCoupons()
                      }}
                    >
                      Refresh Coupons
                    </Button>
                    {userData?.type === "merchant" && (
                      <Button
                        className="mt-4 ml-4"
                        onClick={() => safeNavigate("/(protected)/merchant/create-program/coupon-book")}
                      >
                        Create Coupon Book
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Debug Coupons Component - only show in debug mode */}
      {SHOW_DEBUG && (
        <div className="mt-8">
          <DebugCoupons />
        </div>
      )}

      {/* Debug message - only show in debug mode */}
      {SHOW_DEBUG && debugMessage && (
        <div className="mt-8 text-center">
          <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-md">{debugMessage}</div>
        </div>
      )}
    </main>
  )
}