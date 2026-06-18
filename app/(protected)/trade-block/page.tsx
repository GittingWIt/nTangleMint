'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/wallet-context'
import { useWalletRedirect } from '@/hooks/useWalletRedirect'
import Loading from '@/components/loading'
import { MarketStatsPanel } from '@/components/trade-block/market-stats-panel'
import { ListingsGrid } from '@/components/trade-block/listings-grid'
import { FilterPanel } from '@/components/trade-block/filter-panel'

export default function TradeBlockPage() {
  const { wallet } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [filters, setFilters] = useState({
    programName: '',
    priceMin: 0,
    priceMax: 10000000,
    seller: '',
  })

  // Use wallet redirect hook
  useWalletRedirect({
    redirectToWalletWhenExists: false,
  })

  // Load marketplace data
  useEffect(() => {
    async function loadMarketplaceData() {
      if (!wallet) return

      try {
        setIsLoading(true)

        // Fetch listings
        const listingsRes = await fetch('/api/trade-block/listings')
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json()
          setListings(listingsData.listings || [])
        }

        // Fetch market stats
        const statsRes = await fetch('/api/trade-block/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('[TradeBlock] Error loading marketplace data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMarketplaceData()
  }, [wallet])

  // Apply filters
  useEffect(() => {
    let filtered = listings

    if (filters.programName) {
      filtered = filtered.filter(l =>
        l.programName.toLowerCase().includes(filters.programName.toLowerCase())
      )
    }

    if (filters.priceMin || filters.priceMax) {
      filtered = filtered.filter(
        l => l.listingPrice >= filters.priceMin && l.listingPrice <= filters.priceMax
      )
    }

    if (filters.seller) {
      filtered = filtered.filter(l =>
        l.listedBy.toLowerCase().includes(filters.seller.toLowerCase())
      )
    }

    setFilteredListings(filtered)
  }, [listings, filters])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Trade Block</h1>
          <p className="text-muted-foreground">
            Browse and purchase punch cards from other collectors
          </p>
        </div>

        {/* Market Stats */}
        {stats && <MarketStatsPanel stats={stats} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {filteredListings.length > 0 ? (
              <ListingsGrid listings={filteredListings} buyerAddress={wallet?.publicAddress || ''} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No listings match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}