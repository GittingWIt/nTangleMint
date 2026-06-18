'use client'

import { useState } from 'react'
import type { PunchCard } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Zap, ShoppingCart, X } from 'lucide-react'
import Link from 'next/link'
import { MarketplaceCardActions } from '@/components/punch-card/marketplace-card-actions'

interface PunchCardsSectionProps {
  activePunchCards: PunchCard[]
  completedPunchCards: PunchCard[]
  isLoading?: boolean
}

export function PunchCardsSection({
  activePunchCards,
  completedPunchCards,
  isLoading = false
}: PunchCardsSectionProps) {
  const totalCards = activePunchCards.length + completedPunchCards.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (totalCards === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">No punch cards yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Join a loyalty program to start collecting punches</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Cards</CardTitle>
            <CardDescription>Currently earning punches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePunchCards.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
            <CardDescription>Rewards redeemed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPunchCards.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Punch Cards */}
      {activePunchCards.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Active Cards</h3>
            <p className="text-sm text-muted-foreground mb-4">Cards you own and can punch or sell</p>
          </div>
          <div className="grid gap-4">
            {activePunchCards.map((card) => (
              <Card key={card.txId} className="border-blue-200">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-base">{card.program?.name || 'Program'}</CardTitle>
                    <CardDescription>Punches: {card.punches}/{card.requiredPunches}</CardDescription>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (card.punches / card.requiredPunches) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.requiredPunches - card.punches} punches until reward
                  </p>
                  <MarketplaceCardActions
                    card={card}
                    cardId={`${card.programId}_${card.participantAddress}`}
                    programId={card.programId || ''}
                    programName={card.program?.name || ''}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Punch Cards */}
      {completedPunchCards.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Redeemed Rewards</h3>
            <p className="text-sm text-muted-foreground mb-4">Rewards you&apos;ve redeemed</p>
          </div>
          <div className="grid gap-4">
            {completedPunchCards.map((card) => (
              <Card key={card.txId} className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base">{card.program?.name || 'Program'}</CardTitle>
                  <CardDescription>✓ Redeemed on {new Date(card.redeemedAt || card.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}