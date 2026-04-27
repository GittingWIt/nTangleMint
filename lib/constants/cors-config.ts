/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Defines which origins are allowed to access your API
 *
 * Security Principle: Never allow all origins (*) in production
 * Only allow trusted domains that actually need API access
 */

/**
 * Get allowed origins based on environment
 * Uses environment variables for different deployment stages
 */
export function getAllowedOrigins(): string[] {
  // Development environment - allow localhost variations
  if (process.env.NODE_ENV === "development") {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];
  }

  // Production environment - only allow configured domains
  const productionOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  // Always allow your main domain
  if (process.env.NEXT_PUBLIC_APP_URL && !productionOrigins.includes(process.env.NEXT_PUBLIC_APP_URL)) {
    productionOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  return productionOrigins;
}

/**
 * Check if an origin is allowed
 * @param origin - The origin to check (from request headers)
 * @returns true if origin is in allowed list
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * CORS headers to send with responses
 * These headers tell browsers what origins can access the resource
 */
export const CORS_HEADERS = {
  // Allow only authenticated requests from allowed origins
  "Access-Control-Allow-Origin": "", // Will be set dynamically based on origin
  // Allow credentials (cookies, auth headers)
  "Access-Control-Allow-Credentials": "true",
  // Allowed HTTP methods
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  // Allowed headers that can be sent with requests
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  // How long preflight can be cached (in seconds)
  "Access-Control-Max-Age": "86400", // 24 hours
  // Allowed response headers that client can access
  "Access-Control-Expose-Headers": "X-Total-Count, X-Page-Number",
} as const;

/**
 * Endpoints that should have strict CORS protection
 * These are the most sensitive endpoints
 */
export const PROTECTED_ENDPOINTS = [
  "/api/bsv", // Transaction broadcasting
  "/api/wallet", // Wallet operations
  "/api/auth", // Authentication
];

/**
 * Endpoints that can be more permissive
 * Read-only operations can be accessed from more origins
 * External endpoints query third-party services (WhatsOnChain, BSV APIs) and don't expose sensitive data
 */
export const PUBLIC_ENDPOINTS = [
  "/api/program/list", // List programs (public info)
  "/api/health", // Health check
  "/api/external", // External API queries (balance, block height, onchain state) - read-only
];