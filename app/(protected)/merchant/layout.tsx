import type React from "react"
import { ProgramSync } from "@/components/program-sync"

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <ProgramSync />
      <div className="container mx-auto p-4">{children}</div>
    </div>
  )
}