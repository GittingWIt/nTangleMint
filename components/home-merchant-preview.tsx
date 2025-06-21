"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { getFeaturedMerchants } from "@/lib/utils/merchant-utils"

export function HomeMerchantPreview() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        setIsLoading(true)
        const featuredMerchants = getFeaturedMerchants(3) // Get up to 3 featured merchants

        const defaultMerchant = {
          id: "default",
          businessName: "# 1 Summa",
          publicAddress: "default-address",
          description: "Local coffee shop with great loyalty programs",
          logo: "/placeholder.svg?height=50&width=50",
        }

        // If no merchants found, add the default one
        if (featuredMerchants.length === 0) {
          setMerchants([defaultMerchant])
        } else {
          setMerchants(featuredMerchants)
        }
      } catch (error) {
        console.error("Error loading merchants:", error)
        const defaultMerchant = {
          id: "default",
          businessName: "# 1 Summa",
          publicAddress: "default-address",
          description: "Local coffee shop with great loyalty programs",
          logo: "/placeholder.svg?height=50&width=50",
        }
        // Add default merchant on error
        setMerchants([defaultMerchant])
      } finally {
        setIsLoading(false)
      }
    }

    loadMerchants()
  }, [])

  if (isLoading || merchants.length === 0) {
    return null
  }

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Featured Merchants</h2>
        <Link href="/merchants">
          <Button variant="outline" className="gap-2">
            View All Merchants
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <Card key={merchant.id || merchant.publicAddress} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{merchant.businessName}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {merchant.description || "Check out this merchant's loyalty programs."}
                </p>
              </div>

              <Link href={`/merchants/${merchant.publicAddress}`}>
                <Button variant="outline" className="w-full gap-2">
                  View Programs
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}