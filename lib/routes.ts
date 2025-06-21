import type { WalletData } from "@/types"

// Route configuration types
export type RouteAccess = "public" | "customer" | "merchant" | "authenticated"

export interface Route {
  path: string
  access: RouteAccess
  children?: Route[]
}

// Define all application routes with their access requirements
export const routes: Route[] = [
  // Public routes
  { path: "/", access: "public" },
  { path: "/about", access: "public" },
  { path: "/wallet-generation", access: "public" },
  { path: "/wallet-restoration", access: "public" },

  // Customer routes (previously "user")
  {
    path: "/customer",
    access: "customer",
    children: [
      { path: "/dashboard", access: "customer" },
      { path: "/programs", access: "customer" },
      { path: "/rewards", access: "customer" },
    ],
  },

  // Merchant routes
  {
    path: "/merchant",
    access: "merchant",
    children: [
      { path: "/dashboard", access: "merchant" },
      { path: "/create-program", access: "merchant" },
      { path: "/create-program/punch-card", access: "merchant" },
      { path: "/create-program/points", access: "merchant" },
      { path: "/create-program/tiered", access: "merchant" },
      { path: "/create-program/coalition", access: "merchant" },
      { path: "/create-program/coupon-book", access: "merchant" },
    ],
  },
]

// Helper functions for route checking
export function isPublicRoute(path: string): boolean {
  return findRoute(path)?.access === "public"
}

export function findRoute(path: string): Route | undefined {
  function search(routes: Route[], searchPath: string): Route | undefined {
    for (const route of routes) {
      if (matchRoute(route.path, searchPath)) {
        return route
      }
      if (route.children) {
        const childMatch = search(route.children, searchPath)
        if (childMatch) return childMatch
      }
    }
    return undefined
  }

  return search(routes, path)
}

export function matchRoute(routePath: string, currentPath: string): boolean {
  // Convert route paths to regex patterns
  const pattern = routePath
    .replace(/\/\*/g, "/?.*") // Handle wildcards
    .replace(/:[\w-]+/g, "[\\w-]+") // Handle parameters

  return new RegExp(`^${pattern}$`).test(currentPath)
}

export function canAccessRoute(path: string, walletData: WalletData | null): boolean {
  const route = findRoute(path)
  if (!route) return false

  switch (route.access) {
    case "public":
      return true
    case "authenticated":
      return !!walletData
    case "customer":
      // Cast to any to handle legacy "user" type that might exist at runtime
      return walletData?.type === "customer" || (walletData?.type as any) === "user"
    case "merchant":
      return walletData?.type === "merchant"
    default:
      return false
  }
}

export function getDefaultRoute(walletData: WalletData | null): string {
  if (!walletData) return "/wallet-generation"

  // Handle legacy "user" type by mapping it to "customer"
  // Use type assertion to handle the legacy "user" type
  const type = (walletData.type as any) === "user" ? "customer" : walletData.type

  // For unknown wallet types, default to customer dashboard
  return `/${type}/dashboard`
}

export function getBasePath(path: string): string {
  return `/${path.split("/")[1]}`
}