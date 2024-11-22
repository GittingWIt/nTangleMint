import Link from "next/link"
import { ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from 'lucide-react'

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Loyalty Reimagined
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Empower your business with blockchain-based loyalty programs. Connect with customers, partner with local businesses, and grow your community.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button size="lg" className="bg-[#0A0B0D] hover:bg-[#0A0B0D]/90 text-white" asChild>
              <Link href="/create-program">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="w-full max-w-5xl mx-auto px-4 mb-16">
          <div className="flex justify-between bg-white rounded-lg p-8">
            <div className="text-center flex-1 flex flex-col items-center">
              <h3 className="text-2xl font-bold">152</h3>
              <p className="text-gray-500">Active Programs</p>
              <p className="text-sm text-gray-400 text-center">Current loyalty programs</p>
            </div>
            <div className="text-center flex-1 flex flex-col items-center">
              <h3 className="text-2xl font-bold">18,634</h3>
              <p className="text-gray-500">Total Participants</p>
              <p className="text-sm text-gray-400 text-center">Across all programs</p>
            </div>
            <div className="text-center flex-1 flex flex-col items-center">
              <h3 className="text-2xl font-bold">3,721</h3>
              <p className="text-gray-500">Rewards Claimed</p>
              <p className="text-sm text-gray-400 text-center">Last 30 days</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto grid gap-6 md:grid-cols-3 max-w-5xl">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Simple Integration</h3>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                Easy-to-use tools for creating and managing loyalty programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Local Partnerships</h3>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                Connect with other local businesses to create powerful coalition programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Secure & Transparent</h3>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                Blockchain-powered security and transparency for all transactions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}