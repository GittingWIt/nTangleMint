'use client'

import { useState } from 'react'
import type { PunchCard } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Tag, X } from 'lucide-react'
import { listCardAction, delistCardAction } from '@/app/actions/marketplace-actions'
import { useWallet } from '@/contexts/wallet-context'
import { useToast } from '@/hooks/use-toast'

interface MarketplaceCardActionsProps {
  card: PunchCard
  cardId: string
  programId: string
  programName: string
}

export function MarketplaceCardActions({
  card,
  cardId,
  programId,
  programName,
}: MarketplaceCardActionsProps) {
  const { wallet } = useWallet()
  const { toast } = useToast()
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [isListing, setIsListing] = useState(false)
  const [isDelisting, setIsDelisting] = useState(false)
  const [listingStatus, setListingStatus] = useState<'active' | 'listed' | null>(null)

  const handleList = async () => {
    if (!wallet) return
    if (!listingPrice || parseInt(listingPrice) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      })
      return
    }

    setIsListing(true)
    try {
      const result = await listCardAction({
        sellerAddress: wallet.publicAddress,
        programId,
        programName,
        cardId,
        listingPrice: parseInt(listingPrice),
      })

      if (result.success) {
        setListingStatus('listed')
        setIsListingModalOpen(false)
        setListingPrice('')
        toast({
          title: 'Success',
          description: 'Card listed for sale',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to list card',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to list card',
        variant: 'destructive',
      })
    } finally {
      setIsListing(false)
    }
  }

  const handleDelist = async () => {
    if (!wallet) return

    setIsDelisting(true)
    try {
      const result = await delistCardAction({
        sellerAddress: wallet.publicAddress,
        programId,
        programName,
        cardId,
      })

      if (result.success) {
        setListingStatus(null)
        toast({
          title: 'Success',
          description: 'Card removed from marketplace',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delist card',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delist card',
        variant: 'destructive',
      })
    } finally {
      setIsDelisting(false)
    }
  }

  if (!wallet) return null

  return (
    <div className="flex gap-2">
      {listingStatus === 'listed' ? (
        <Button
          onClick={handleDelist}
          disabled={isDelisting}
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
        >
          <X className="w-4 h-4" />
          {isDelisting ? 'Removing...' : 'Delist'}
        </Button>
      ) : (
        <Dialog open={isListingModalOpen} onOpenChange={setIsListingModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Tag className="w-4 h-4" />
              List for Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List Card for Sale</DialogTitle>
              <DialogDescription>
                Set the price in satoshis for your {programName} punch card
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Price (satoshis)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="1000"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  disabled={isListing}
                />
              </div>
              <Button
                onClick={handleList}
                disabled={isListing}
                className="w-full gap-2"
              >
                <Tag className="w-4 h-4" />
                {isListing ? 'Listing...' : 'List Card'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}