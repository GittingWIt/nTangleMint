import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center">
        {children}
      </main>
    </div>
  )
}