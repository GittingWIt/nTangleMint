import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/middleware/rate-limiter'
import { getClientId } from '@/lib/utils/get-client-id'
import { RATE_LIMITS } from '@/lib/constants/rate-limits'
import { checkCORS, handleCORSPreflight } from '@/lib/middleware/cors'

import cacheService, { CACHE_TTL } from "@/lib/services/cache-service"

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight requests
  return handleCORSPreflight(request)
}

export async function GET(request: NextRequest) {
  // Check CORS - /api/bsv is a protected endpoint
  const { allowed: corsAllowed } = checkCORS(request)
  if (!corsAllowed) {
    console.warn(`[v0] [API/BSV] CORS rejected request from origin: ${request.headers.get('origin')}`)
    return NextResponse.json(
      { error: 'CORS policy: Origin not allowed' },
      { status: 403 }
    )
  }

  // Check rate limit (MEDIUM priority: 100 requests per minute)
  const clientId = await getClientId()
  const rateLimitResult = await rateLimiter(
    clientId,
    RATE_LIMITS.MEDIUM.maxRequests,
    RATE_LIMITS.MEDIUM.windowMs
  )

  if (!rateLimitResult.allowed) {
    console.log(`[v0] [API] Rate limit exceeded for ${clientId}`)
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          'Retry-After': (rateLimitResult.retryAfter ?? 0).toString(),
          'X-RateLimit-Limit': RATE_LIMITS.MEDIUM.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  }

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  // Route: /api/bsv?type=minterest&address=...
  if (type === 'minterest' || pathname.includes('/minterest')) {
    return handleMinterest(searchParams)
  }

  // Route: /api/bsv?address=... or /api/bsv/balance
  if (pathname.includes('/balance') || searchParams.has('address')) {
    return handleBalance(searchParams)
  }

  // Route: /api/bsv?type=chain or /api/bsv/chain
  if (type === 'chain' || pathname.includes('/chain')) {
    return handleChainInfo(searchParams)
  }

  // Route: /api/bsv?type=tx or /api/bsv/tx or /api/bsv/transaction
  if (type === 'tx' || pathname.includes('/tx') || pathname.includes('/transaction')) {
    return handleTransaction(searchParams)
  }

  return NextResponse.json(
    { error: 'Unknown endpoint' },
    { status: 404 }
  )
}

/**
 * Handle Minterest requests - query blockchain for all programs customer has shown interest in
 * GET /api/bsv?type=minterest&address=...
 */
async function handleMinterest(searchParams: URLSearchParams) {
  const address = searchParams.get('address')
  let network = searchParams.get('network') || 'test'
  
  if (network === 'testnet') network = 'test'

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    )
  }

  const cacheKey = `minterest:${address}:${network}`
  const cached = cacheService.get<unknown>(cacheKey)

  if (cached !== null) {
    console.log(`[v0] [API] Returning cached Minterest for ${address}`)
    return NextResponse.json(cached, { status: 200 })
  }

  try {
    console.log(`[v0] [API] Querying Minterest for ${address} on ${network}`)

    // Query all nTangleMint transactions
    const searchUrl = `https://api.whatsonchain.com/v1/bsv/${network}/script/search/nTangleMint`

    const response = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`[v0] [API] Failed to fetch nTangleMint transactions: ${response.status}`)
      return NextResponse.json({ programIds: [] }, { status: 200 })
    }

    const transactions = await response.json()
    console.log(`[v0] [API] Found ${Array.isArray(transactions) ? transactions.length : 0} nTangleMint transactions`)

    if (!Array.isArray(transactions)) {
      return NextResponse.json({ programIds: [] }, { status: 200 })
    }

    const programIds: string[] = []
    const seenPrograms = new Set<string>()

    // Parse each transaction for Minterest records
    for (const tx of transactions) {
      try {
        if (!tx.vout || !Array.isArray(tx.vout)) continue

        for (const output of tx.vout) {
          const scriptHex = output.scriptPubKey?.hex
          if (!scriptHex || !scriptHex.startsWith('6a')) continue

          // Parse OP_RETURN script: 6a <push1> <data1> <push2> <data2> ...
          const scriptBuffer = Buffer.from(scriptHex, 'hex')
          const fields: string[] = []

          let pos = 1 // Skip OP_RETURN opcode
          while (pos < scriptBuffer.length) {
            const byte = scriptBuffer[pos]

            if (byte <= 0x4b) {
              // Direct push (1 byte length + data)
              const len = byte
              pos += 1
              if (pos + len <= scriptBuffer.length) {
                const field = scriptBuffer.subarray(pos, pos + len).toString('utf-8')
                fields.push(field)
                pos += len
              } else {
                break
              }
            } else if (byte === 0x4c) {
              // OP_PUSHDATA1
              pos += 1
              if (pos >= scriptBuffer.length) break
              const len = scriptBuffer[pos]
              pos += 1
              if (pos + len <= scriptBuffer.length) {
                const field = scriptBuffer.subarray(pos, pos + len).toString('utf-8')
                fields.push(field)
                pos += len
              } else {
                break
              }
            } else if (byte === 0x4d) {
              // OP_PUSHDATA2
              pos += 1
              if (pos + 2 > scriptBuffer.length) break
              const len = scriptBuffer.readUInt16LE(pos)
              pos += 2
              if (pos + len <= scriptBuffer.length) {
                const field = scriptBuffer.subarray(pos, pos + len).toString('utf-8')
                fields.push(field)
                pos += len
              } else {
                break
              }
            } else {
              break
            }
          }

          // Check for Minterest record: ["nTangleMint", "Minterest", programId, customerAddress, timestamp]
          if (fields.length >= 4 && fields[0] === 'nTangleMint' && fields[1] === 'Minterest') {
            const programId = fields[2]
            const txAddress = fields[3]?.trim()

            if (txAddress === address.trim() && !seenPrograms.has(programId)) {
              programIds.push(programId)
              seenPrograms.add(programId)
              console.log(`[v0] [API] Found Minterest for program ${programId}`)
            }
          }
        }
      } catch (error) {
        console.warn(`[v0] [API] Error parsing transaction ${tx.txid}:`, error)
      }
    }

    const result = { programIds }
    cacheService.set(cacheKey, result, CACHE_TTL.PROGRAM)
    
    console.log(`[v0] [API] Minterest query complete - found ${programIds.length} programs for ${address}`)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[v0] [API] Minterest query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query Minterest' },
      { status: 500 }
    )
  }
}

/**
 * Handle balance requests
 * GET /api/bsv/balance?address=...&network=test
 */
async function handleBalance(searchParams: URLSearchParams) {
  const address = searchParams.get('address')
  let network = searchParams.get('network') || 'test'
  
  // Convert 'testnet' to 'test' for WhatsOnChain API
  if (network === 'testnet') network = 'test'

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Check cache first
    const cacheKey = `balance:${address}:${network}`
    const cached = cacheService.get<{ confirmed: number; unconfirmed: number }>(cacheKey)

    if (cached !== null) {
      console.log(`[v0] Cache hit for ${address} on ${network}`)
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    console.log(`[v0] Fetching balance for ${address} on ${network}`)

    // WhatsOnChain uses separate endpoints for confirmed and unconfirmed balance
    const confirmedUrl = `https://api.whatsonchain.com/v1/bsv/${network}/address/${address}/confirmed/balance`
    const unconfirmedUrl = `https://api.whatsonchain.com/v1/bsv/${network}/address/${address}/unconfirmed/balance`
    
    console.log(`[v0] Confirmed URL: ${confirmedUrl}`)
    console.log(`[v0] Unconfirmed URL: ${unconfirmedUrl}`)
    
    const [confirmedResponse, unconfirmedResponse] = await Promise.all([
      fetch(confirmedUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      }),
      fetch(unconfirmedUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      }),
    ])

    console.log(`[v0] Confirmed response status: ${confirmedResponse.status}`)
    console.log(`[v0] Unconfirmed response status: ${unconfirmedResponse.status}`)

    if (!confirmedResponse.ok || !unconfirmedResponse.ok) {
      const confirmedError = await confirmedResponse.text()
      const unconfirmedError = await unconfirmedResponse.text()
      console.error(`[v0] Confirmed error: ${confirmedResponse.status} - ${confirmedError}`)
      console.error(`[v0] Unconfirmed error: ${unconfirmedResponse.status} - ${unconfirmedError}`)
      
      return NextResponse.json(
        { confirmed: 0, unconfirmed: 0 },
        { status: 200 }
      )
    }

    const confirmedData = await confirmedResponse.json()
    const unconfirmedData = await unconfirmedResponse.json()
    
    console.log(`[v0] Confirmed data:`, confirmedData)
    console.log(`[v0] Unconfirmed data:`, unconfirmedData)

    // WhatsOnChain returns the balance as a number directly, not as an object
    // confirmed endpoint returns: { "confirmed": 23000 }
    // unconfirmed endpoint returns: { "unconfirmed": 0 } or similar
    const confirmed = typeof confirmedData === 'number' ? confirmedData : (confirmedData.confirmed || 0)
    const unconfirmed = typeof unconfirmedData === 'number' ? unconfirmedData : (unconfirmedData.unconfirmed || 0)
    
    const data = {
      confirmed,
      unconfirmed,
    }

    // Cache the result with BALANCE TTL (30 seconds)
    cacheService.set(cacheKey, data, CACHE_TTL.BALANCE)

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('[v0] Balance fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}

/**
 * Handle chain info requests
 * GET /api/bsv/chain?network=testnet
 */
async function handleChainInfo(searchParams: URLSearchParams) {
  let network = searchParams.get('network') || 'testnet'
  
  // Convert 'testnet' to 'test' for WhatsOnChain API
  if (network === 'testnet') network = 'test'

  try {
    // Check cache first
    const cacheKey = `chain:${network}`
    const cached = cacheService.get<unknown>(cacheKey)

    if (cached !== null) {
      console.log(`[v0] Cache hit for chain info on ${network}`)
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    console.log(`[v0] Fetching chain info for ${network}`)

    const wocUrl = `https://api.whatsonchain.com/v1/bsv/${network}/chain/info`
    console.log(`[v0] Chain info URL: ${wocUrl}`)

    const response = await fetch(wocUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    })

    console.log(`[v0] WhatsOnChain chain response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Chain info API error: ${response.status} ${response.statusText}`)
      console.error(`[v0] Error details: ${errorText}`)
      
      // Return a default/cached block height instead of failing
      // This prevents the app from crashing when WhatsOnChain is unavailable
      console.log(`[v0] Returning fallback block height due to API error`)
      return NextResponse.json(
        { blocks: 0, error: 'Using fallback value' },
        { status: 200 }
      )
    }

    const data = await response.json()
    console.log(`[v0] Chain info fetched successfully:`, data)

    // Cache chain info with BALANCE TTL (30 seconds - changes with new blocks)
    cacheService.set(cacheKey, data, CACHE_TTL.BALANCE)

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('[v0] Chain info fetch error:', error)
    return NextResponse.json(
      { blocks: 0, error: error instanceof Error ? error.message : 'Failed to fetch chain info' },
      { status: 200 }
    )
  }
}

/**
 * Handle transaction requests
 * GET /api/bsv/tx?txid=...&network=testnet
 */
async function handleTransaction(searchParams: URLSearchParams) {
  const txid = searchParams.get('txid')
  const network = searchParams.get('network') || 'testnet'

  if (!txid) {
    return NextResponse.json(
      { error: 'TXID parameter is required' },
      { status: 400 }
    )
  }

  try {
    console.log(`[v0] Fetching transaction ${txid} on ${network}`)

    const response = await fetch(
      `https://api.whatsonchain.com/v1/bsv/${network}/tx/${txid}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      }
    )

    if (!response.ok) {
      console.error(`[v0] WhatsOnChain API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `WhatsOnChain API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`[v0] Transaction fetched successfully:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Transaction fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}