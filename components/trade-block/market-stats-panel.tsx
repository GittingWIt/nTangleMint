'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface MarketStatsPanelProps {
  stats: {
    totalListings: number
    avgPrice: number
    minPrice: number
    maxPrice: number
    volume24h: number
    totalVolume24h: number
  }
}

export function MarketStatsPanel({ stats }: MarketStatsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Active Listings</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalListings}</p>
          </div>
          <div className="text-3xl opacity-20">📊</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Avg Price</p>
            <p className="text-2xl font-bold text-foreground">{stats.avgPrice.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">sats</p>
          </div>
          <div className="text-3xl opacity-20">💰</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Price Range</p>
            <div className="text-sm font-mono text-foreground">
              <span className="text-xs">{stats.minPrice.toLocaleString()}</span>
              <span className="mx-1">-</span>
              <span className="text-xs">{stats.maxPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">sats</p>
          </div>
          <div className="text-3xl opacity-20">📈</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Trades (24h)</p>
            <p className="text-2xl font-bold text-foreground">{stats.volume24h}</p>
          </div>
          <div className="text-3xl opacity-20">⚡</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Volume (24h)</p>
            <p className="text-xl font-bold text-foreground">{(stats.totalVolume24h / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground">sats</p>
          </div>
          <TrendingUp className="w-6 h-6 opacity-20" />
        </div>
      </Card>
    </div>
  )
}