import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /user, /merchant)
  const path = request.nextUrl.pathname

  // If the path includes dashboard, check for wallet data
  if (path.includes("dashboard")) {
    const hasWallet = request.cookies.has("wallet_data")

    if (!hasWallet) {
      return NextResponse.redirect(new URL("/wallet-generation", request.url))
    }
  }

  // If we're on wallet-generation and have wallet data, redirect to appropriate dashboard
  if (path === "/wallet-generation") {
    const walletData = request.cookies.get("wallet_data")
    if (walletData) {
      try {
        const { type } = JSON.parse(walletData.value)
        return NextResponse.redirect(new URL(`/${type}/dashboard`, request.url))
      } catch (error) {
        // If there's an error parsing the wallet data, continue to wallet-generation
        return NextResponse.next()
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/wallet-generation", "/:type/dashboard"],
}

