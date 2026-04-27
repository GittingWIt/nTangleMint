import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkCORS, handleCORSPreflight, withCORSHeaders } from "@/lib/middleware/cors"
import { checkIPThrottle, getClientIP } from "@/lib/middleware/ip-throttle"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Handle CORS preflight requests (OPTIONS)
  if (request.method === "OPTIONS") {
    return handleCORSPreflight(request)
  }

  // IP Throttling for API routes
  if (path.startsWith("/api")) {
    const clientIP = getClientIP(request)
    const { limited, remaining, resetIn } = checkIPThrottle(clientIP, path)
    
    if (limited) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Too many requests", 
          retryAfter: resetIn 
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(resetIn),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetIn),
          } 
        }
      )
    }
  }

  // Check CORS for all requests
  const { allowed: corsAllowed, headers: corsHeaders } = checkCORS(request)

  // If CORS check fails for protected endpoint, reject with 403
  if (!corsAllowed && path.startsWith("/api")) {
    console.warn(`[v0] CORS rejected request to ${path}`)
    const response = new NextResponse(
      JSON.stringify({ error: "CORS policy: Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Apply CORS headers to response
  let response = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}