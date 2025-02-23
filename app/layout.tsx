import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import type React from "react"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nTangleMint",
  description: "Bitcoin SV Loyalty Program Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-100 p-4">
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/test-bsv" className="hover:underline">
                BSV Tests
              </Link>
            </li>
            <li>
              <Link href="/test-bsv/lifecycle-test" className="hover:underline">
                Lifecycle Test
              </Link>
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  )
}