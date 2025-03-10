import type React from "react"
export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-4">Test Runner</h1>
        {children}
      </div>
    </div>
  )
}