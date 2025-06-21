import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">nTangleMint Loyalty Platform</h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-8">
        Join loyalty programs from your favorite merchants and earn rewards
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" asChild>
          <Link href="/dashboard">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/merchant">Merchant Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}