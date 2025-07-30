import type React from "react"

// Ensure proper revalidation settings for program creation
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function CreateProgramLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}