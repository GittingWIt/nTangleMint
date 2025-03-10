import type React from "react"

export default function CreateProgramLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Create Program</h1>
        <p className="text-muted-foreground">Create a new program for your customers.</p>
      </div>
      {children}
    </div>
  )
}