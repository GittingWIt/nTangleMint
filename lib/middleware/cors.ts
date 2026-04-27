/**
 * CORS Middleware Utility
 * Handles Cross-Origin Resource Sharing (CORS) validation and header generation
 *
 * CORS protects against:
 * - Unauthorized cross-origin requests from malicious sites
 * - API abuse from external domains
 * - Session hijacking through cross-origin requests
 *
 * How it works:
 * 1. Browser sends Origin header with request
 * 2. Server validates if origin is in allowed list
 * 3. Server responds with Access-Control-Allow-Origin header
 * 4. Browser checks if origin matches - if not, blocks response
 */

import { NextRequest, NextResponse } from "next/server";
import { isOriginAllowed, CORS_HEADERS, PROTECTED_ENDPOINTS, PUBLIC_ENDPOINTS } from "@/lib/constants/cors-config";

export interface CORSOptions {
  endpoint?: string;
  method?: string;
}

/**
 * Generate CORS headers for a response
 * Dynamically sets the allowed origin based on request
 *
 * @param origin - Origin from request headers
 * @param endpoint - API endpoint being accessed
 * @returns CORS headers to include in response
 */
export function generateCORSHeaders(origin: string | undefined, endpoint: string = "/api/default"): Record<string, string> {
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
  };

  // Only set Access-Control-Allow-Origin if origin is allowed
  // This is critical security: never echo back untrusted origins
  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (process.env.NODE_ENV === "development" && origin) {
    // In dev, log rejected origins for debugging
    console.log("[v0] CORS: Rejected origin", origin);
  }

  return headers;
}

/**
 * Check if a request should be allowed based on CORS rules
 *
 * @param request - NextRequest object
 * @returns Object with {allowed: boolean, headers: Record<string, string>}
 */
export function checkCORS(request: NextRequest): {
  allowed: boolean;
  headers: Record<string, string>;
} {
  const origin = request.headers.get("origin") || undefined;
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  // Get CORS headers for this request
  const corsHeaders = generateCORSHeaders(origin, pathname);

  // Preflight requests (OPTIONS) are used by browsers to check if actual request will be allowed
  // Always respond to preflight requests if origin is allowed
  if (method === "OPTIONS") {
    const originAllowed = !!(origin && isOriginAllowed(origin));
    return {
      allowed: originAllowed,
      headers: corsHeaders,
    };
  }

  // For actual requests, check if origin is allowed
  const originAllowed = !!(origin && isOriginAllowed(origin));

  // For protected endpoints, origin MUST be allowed
  const isProtectedEndpoint = PROTECTED_ENDPOINTS.some((endpoint) => pathname.startsWith(endpoint));
  if (isProtectedEndpoint && !originAllowed) {
    console.warn(`[v0] CORS: Blocked request to ${pathname} from ${origin || "unknown origin"}`);
    return {
      allowed: false,
      headers: corsHeaders,
    };
  }

  // For public endpoints, allow any origin (but set header anyway for good practice)
  return {
    allowed: true,
    headers: corsHeaders,
  };
}

/**
 * Handle CORS preflight (OPTIONS) requests
 * Browsers send OPTIONS before actual requests to check if allowed
 *
 * @param request - NextRequest object
 * @returns Response with CORS headers
 */
export function handleCORSPreflight(request: NextRequest): NextResponse {
  const { headers } = checkCORS(request);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to a response
 * Use this to wrap existing responses with CORS headers
 *
 * @param response - NextResponse to add headers to
 * @param request - NextRequest for origin validation
 * @returns Response with CORS headers added
 */
export function withCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const { headers } = checkCORS(request);

  // Add CORS headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}