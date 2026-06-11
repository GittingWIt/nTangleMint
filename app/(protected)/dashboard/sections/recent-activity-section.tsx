'use client'

import { useTransactionHistory, formatTransactionType, formatTransactionAmount, getTransactionColor } from '@/hooks/useTransactionHistory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentActivitySectionProps {
  address: string | null
}

export function RecentActivitySection({ address }: RecentActivitySectionProps) {
  const { transactions, isLoading } = useTransactionHistory(address)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Your recent blockchain transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No transaction history yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.txId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{formatTransactionType(tx.type)}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap">
                        {tx.status === 'confirmed' ? '✓' : '◐'} {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tx.programName && <span>{tx.programName} · </span>}
                      {new Date(tx.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={cn('text-right text-sm font-mono', getTransactionColor(tx.type))}>
                    {formatTransactionAmount(tx.amount, tx.type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}