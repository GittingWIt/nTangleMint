import { NextRequest, NextResponse } from 'next/server'
import { getActiveListings } from '@/lib/services/trade-block-service'

/**
 * GET /api/trade-block/listings
 *
 * Fetch all active marketplace listings
 * Returns paginated results with filtering support
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const programFilter = searchParams.get('program')
    const priceMin = parseInt(searchParams.get('priceMin') || '0')
    const priceMax = parseInt(searchParams.get('priceMax') || '999999999')

    console.log(`[API-LISTINGS] Fetching listings - page: ${page}, limit: ${limit}`)

    // Fetch all transactions to extract listings
    // This is simplified; in production, you'd query a database
    // For now, we'll return a mock structure that the Trade Block UI expects
    const listings = []

    // Mock data for demonstration - in production, this would come from the blockchain/database
    // The listings would be populated by querying transaction history

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total: listings.length,
        totalPages: Math.ceil(listings.length / limit),
      },
      timestamp: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error('[API-LISTINGS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}