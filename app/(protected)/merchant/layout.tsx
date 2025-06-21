import type React from "react"
// Ensure proper revalidation settings
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}