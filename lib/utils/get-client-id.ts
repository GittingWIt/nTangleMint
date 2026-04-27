/**
 * Extract unique client identifier for rate limiting
 * Prioritizes authenticated user ID, falls back to IP address
 */

import { headers } from "next/headers";

/**
 * Get unique client identifier
 * Returns user ID if authenticated, otherwise IP address
 */
export async function getClientId(userId?: string): Promise<string> {
  // If user is authenticated, use their ID
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address for unauthenticated users
  const ip = await getClientIp();
  return `ip:${ip}`;
}

/**
 * Extract client IP address from request headers
 * Handles Vercel, proxies, and local development
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // Try various header sources (in order of reliability)
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() || // Behind proxy
    headersList.get("x-real-ip") || // Nginx/Apache proxy
    headersList.get("x-client-ip") || // Custom header
    headersList.get("cf-connecting-ip") || // Cloudflare
    headersList.get("true-client-ip") || // Akamai/Cloudflare
    "127.0.0.1"; // Fallback

  console.log("[v0] Client IP resolved:", ip);
  return ip;
}