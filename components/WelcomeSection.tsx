'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Store } from 'lucide-react'
import type { WalletData } from '@/types'

export function WelcomeSection({ walletData }: { walletData: WalletData | null }) {
  if (walletData) return null

  return (
    <div className="space-y-8 pb-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold">Loyalty Reimagined</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Empower your business with blockchain-based loyalty programs. Connect
          with customers, partner with local businesses, and grow your community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              For Users
            </CardTitle>
            <CardDescription>
              Join loyalty programs and earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 min-h-[120px]">
              <li>Manage all your rewards in one place</li>
              <li>Track your progress across programs</li>
              <li>Redeem rewards easily</li>
            </ul>
            <Button className="w-full" asChild>
              <Link href="/wallet-generation">
                Get Started
                <span className="sr-only">Get started as a user</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              For Merchants
            </CardTitle>
            <CardDescription>
              Create and manage loyalty programs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 min-h-[120px]">
              <li>Create custom loyalty programs</li>
              <li>Track customer engagement</li>
              <li>Analyze program performance</li>
            </ul>
            <Button className="w-full" asChild>
              <Link href="/wallet-generation">
                Create Program
                <span className="sr-only">Create a program as a merchant</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}