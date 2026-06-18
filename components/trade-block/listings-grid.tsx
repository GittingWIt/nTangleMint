'use client'

import { ListingCard } from './listing-card'

interface Listing {
  cardId: string
  programId: string
  programName: string
  listingPrice: number
  listedBy: string
  listedAtTime: number
  txId: string
  status: string
}

interface ListingsGridProps {
  listings: Listing[]
  buyerAddress: string
}

export function ListingsGrid({ listings, buyerAddress }: ListingsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.cardId} listing={listing} buyerAddress={buyerAddress} />
      ))}
    </div>
  )
}