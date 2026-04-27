'use client'

import { useWallet } from '@/contexts/wallet-context'
import { getActivePunchCards, getCompletedPunchCards } from '@/lib/services/punchcard-service'
import { Flip3DCard } from '@/components/punch-card/flip-3d-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PunchCard } from '@/lib/types'

export function PunchCardGallery() {
  const { wallet } = useWallet()
  const [cards, setCards] = useState<PunchCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!wallet) {
      setIsLoading(false)
      return
    }

    try {
      const active = getActivePunchCards(wallet.publicAddress)
      const completed = getCompletedPunchCards(wallet.publicAddress)
      
      // Filter to only show cards with at least one punch
      const displayCards = [...active, ...completed].filter(card => card.punches > 0).slice(0, 3)
      
      setCards(displayCards)
    } catch (error) {
      console.error('[v0] Error loading punch cards:', error)
      setCards([])
    } finally {
      setIsLoading(false)
    }
  }, [wallet])

  // Don't show gallery if no wallet or no cards
  if (!wallet || cards.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background border-t">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Rewards</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Active Punch Cards
            </h2>
            <p className="text-lg text-muted-foreground">
              Click any card to see program details on the back. Keep earning and redeeming your rewards.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {cards.map((card) => (
              <div key={card.txId} className="flex flex-col">
                <Flip3DCard punchCard={card} showStatus={true} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/dashboard?tab=cards">
              <Button size="lg" className="gap-2">
                View All Cards
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}