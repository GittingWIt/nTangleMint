import type React from "react"

// Ensure proper revalidation settings for program details
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function ProgramDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}