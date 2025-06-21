import type React from "react"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="min-h-screen">{children}</main>
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2025 TangleMint. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}