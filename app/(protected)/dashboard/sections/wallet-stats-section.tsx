'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { refreshWalletBalance } from '@/lib/services/wallet-service'
import type { Wallet } from '@/lib/types'

interface WalletStatsSectionProps {
  balance: number
  blockHeight: number
  wallet: Wallet | null
  isLoading?: boolean
  onRefresh?: (updatedWallet: Wallet) => void
}

export function WalletStatsSection({
  balance,
  blockHeight,
  wallet,
  isLoading = false,
  onRefresh
}: WalletStatsSectionProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddressDiagnostics, setShowAddressDiagnostics] = useState(false)

  const handleRefresh = async () => {
    if (!wallet) return
    try {
      setIsRefreshing(true)
      const updatedWallet = await refreshWalletBalance(wallet)
      if (onRefresh) {
        onRefresh(updatedWallet)
      }
    } catch (error) {
      console.error('[v0] Error refreshing wallet:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddressDiagnostics(!showAddressDiagnostics)}
            className="text-xs"
          >
            {showAddressDiagnostics ? 'Hide' : 'Debug'} Address
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{(balance / 100000000).toFixed(8)} BSV</div>
        <p className="text-xs text-muted-foreground mt-2">Block Height: {blockHeight.toLocaleString()}</p>

        {showAddressDiagnostics && wallet && (
          <div className="mt-6 p-4 bg-slate-900 rounded-lg space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-300">Wallet Address (Context)</p>
              <p className="text-xs font-mono text-slate-100 break-all">{wallet.publicAddress}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Faucet Address</p>
              <p className="text-xs font-mono text-slate-100 break-all">n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Match Status</p>
              {wallet.publicAddress === 'n2BPBLPbMJzdVq5aoCBDozpEZf8LoKSHUg' ? (
                <p className="text-xs text-green-400 font-medium">✓ ADDRESSES MATCH</p>
              ) : (
                <p className="text-xs text-red-400 font-medium">✗ ADDRESSES DO NOT MATCH</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}