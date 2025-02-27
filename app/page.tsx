"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { WalletData } from "@/types" // Updated import path
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Store, Ticket, Gift, Trophy, Users, ShoppingBag, ArrowRight, Search } from "lucide-react"
import { getWalletData } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"

interface UserType {
  type: "user" | "merchant"
  wallet: WalletData | null
}

interface Coupon {
  id: string
  title: string
  description: string
  merchant: string
  image: string
  expirationDate: string
  discountAmount: number
}

export default function Home() {
  const [userData, setUserData] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("featured")

  // Mock coupons data
  const coupons: Coupon[] = [
    {
      id: "1",
      title: "20% off on all items",
      description: "Valid on all store items",
      merchant: "SuperMart",
      image: "/placeholder.svg?height=100&width=200",
      expirationDate: "2024-12-31",
      discountAmount: 20,
    },
    {
      id: "2",
      title: "Buy 1 Get 1 Free",
      description: "On selected items",
      merchant: "FashionStore",
      image: "/placeholder.svg?height=100&width=200",
      expirationDate: "2024-12-31",
      discountAmount: 100,
    },
    // Add more mock coupons as needed
  ]

  const programs = [
    {
      type: "punch-card",
      title: "Coffee Lovers Card",
      description: "Buy 9 coffees, get 1 free",
      merchant: "Local Coffee Shop",
      icon: <Store className="w-6 h-6" />,
      participants: 128,
      rewards: 450,
    },
    {
      type: "coupon-book",
      title: "Downtown Deals",
      description: "Digital coupon book for local shops",
      merchant: "Downtown Association",
      icon: <Ticket className="w-6 h-6" />,
      participants: 256,
      rewards: 890,
    },
    {
      type: "points",
      title: "Dining Points",
      description: "Earn points on every meal",
      merchant: "Restaurant Group",
      icon: <Gift className="w-6 h-6" />,
      participants: 512,
      rewards: 1200,
    },
  ]

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const walletData = await getWalletData()
        if (walletData?.type) {
          setUserData({
            type: walletData.type,
            wallet: walletData,
          })
        } else {
          setUserData(null)
        }
      } catch (error) {
        console.error("Error checking wallet:", error)
        setUserData(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkWallet()
  }, [])

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.merchant.toLowerCase().includes(searchTerm.toLowerCase()),
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
            <Link href={userData?.type === "merchant" ? "/merchant" : "/wallet-generation"}>
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
                    {programs.map((program, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            {program.icon}
                            <Badge>{program.type}</Badge>
                          </div>
                          <CardTitle className="mt-4">{program.title}</CardTitle>
                          <CardDescription>{program.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">By {program.merchant}</div>
                            <div className="flex justify-between text-sm">
                              <span>{program.participants} participants</span>
                              <span>{program.rewards} rewards claimed</span>
                            </div>
                            <Button className="w-full">Join Program</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {["punch-card", "coupon-book", "points"].map((type) => (
                <TabsContent key={type} value={type} className="mt-0">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {programs
                        .filter((program) => program.type === type)
                        .map((program, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                {program.icon}
                                <Badge>{program.type}</Badge>
                              </div>
                              <CardTitle className="mt-4">{program.title}</CardTitle>
                              <CardDescription>{program.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">By {program.merchant}</div>
                                <div className="flex justify-between text-sm">
                                  <span>{program.participants} participants</span>
                                  <span>{program.rewards} rewards claimed</span>
                                </div>
                                <Button className="w-full">Join Program</Button>
                              </div>
                            </CardContent>
                          </Card>
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
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <div className="flex w-max space-x-4 p-4">
                    {filteredCoupons.map((coupon) => (
                      <Card key={coupon.id} className="w-[250px] flex-shrink-0">
                        <CardContent className="p-4">
                          <img
                            src={coupon.image || "/placeholder.svg"}
                            alt={coupon.title}
                            className="w-full h-[100px] object-cover rounded-md mb-2"
                          />
                          <h3 className="font-semibold">{coupon.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                          <p className="text-sm font-medium">{coupon.merchant}</p>
                          <div className="mt-2 flex justify-between items-center text-sm text-muted-foreground">
                            <span>{coupon.discountAmount}% off</span>
                            <span>Expires: {new Date(coupon.expirationDate).toLocaleDateString()}</span>
                          </div>
                          <Button
                            className="w-full mt-2"
                            onClick={() => {
                              if (!userData) {
                                window.location.href = "/wallet-generation"
                              }
                            }}
                          >
                            {userData ? "Clip Coupon" : "Create Wallet to Clip"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}