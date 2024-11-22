import React from 'react'
import Link from 'next/link'
import { Frame } from 'lucide-react'
import Head from 'next/head'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Head>
        <title>nTangleMint</title>
        <meta name="description" content="Your loyalty program platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold sm:text-base mr-4">
          <Frame className="w-6 h-6" />
          <span>nTangleMint</span>
        </Link>
        <nav className="hidden font-medium sm:flex flex-row items-center gap-5 text-sm lg:gap-6">
          <Link href="/" className="text-muted-foreground">Home</Link>
          <Link href="/about" className="text-muted-foreground">About</Link>
          <Link href="/merchants" className="text-muted-foreground">Merchants</Link>
          <Link href="/users" className="text-muted-foreground">Users</Link>
        </nav>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] bg-muted/40 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        {children}
      </main>
    </div>
  )
}