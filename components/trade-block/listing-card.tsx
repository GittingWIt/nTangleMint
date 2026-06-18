'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, CheckCircle } from 'lucide-react'
import { buyCardAction } from '@/app/actions/marketplace-actions'
import { useWallet } from '@/contexts/wallet-context'
import { useToast } from '@/hooks/use-toast'

interface ListingCardProps {
  listing: {
    cardId: string
    programId: string
    programName: string
    listingPrice: number
    listedBy: string
    listedAtTime: number
    txId: string
    status: string
  }
  buyerAddress: string
}

export function ListingCard({ listing, buyerAddress }: ListingCardProps) {
  const { wallet } = useWallet()
  const { toast } = useToast()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)

  const formatTime = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handlePurchase = async () => {
    if (!wallet) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      })
      return
    }

    setIsPurchasing(true)
    try {
      const result = await buyCardAction({
        buyerAddress: wallet.publicAddress,
        sellerAddress: listing.listedBy,
        programId: listing.programId,
        programName: listing.programName,
        cardId: listing.cardId,
        listingPrice: listing.listingPrice,
      })

      if (result.success) {
        setIsPurchased(true)
        toast({
          title: 'Success',
          description: `Card purchased for ${listing.listingPrice.toLocaleString()} sats`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to purchase card',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to purchase card',
        variant: 'destructive',
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  const isOwnListing = wallet?.publicAddress === listing.listedBy

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4">
        <h3 className="font-bold text-foreground truncate">{listing.programName}</h3>
        <p className="text-xs text-muted-foreground font-mono mt-1">{listing.cardId}</p>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <div className="border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">List Price</span>
            <span className="text-2xl font-bold text-foreground">
              {listing.listingPrice.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">satoshis</p>
        </div>

        {/* Seller Info */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-1">Seller</p>
          <p className="text-sm font-mono text-foreground">{formatAddress(listing.listedBy)}</p>
        </div>

        {/* Listing Time */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">Listed {formatTime(listing.listedAtTime)}</p>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border">
          {isPurchased ? (
            <Button disabled className="w-full gap-2" variant="outline">
              <CheckCircle className="w-4 h-4" />
              Purchased
            </Button>
          ) : isOwnListing ? (
            <Button disabled className="w-full" variant="secondary">
              Your Listing
            </Button>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full gap-2"
              variant="default"
            >
              <ShoppingCart className="w-4 h-4" />
              {isPurchasing ? 'Processing...' : 'Buy Now'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}