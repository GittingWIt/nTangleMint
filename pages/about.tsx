import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">About nTangleMint</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
          <CardDescription>Revolutionizing loyalty programs through blockchain technology</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            nTangleMint is at the forefront of transforming how businesses and customers interact through loyalty programs. By leveraging the power of blockchain, we're creating a more transparent, efficient, and rewarding experience for everyone involved.
          </p>
          <p>
            Our platform enables businesses to create unique, tradeable loyalty tokens that provide real value to customers while fostering stronger brand relationships.
          </p>
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Blockchain-based loyalty tokens</li>
            <li>Seamless integration with existing systems</li>
            <li>Real-time analytics and insights</li>
            <li>Customizable reward structures</li>
            <li>Secure and transparent transactions</li>
          </ul>
        </CardContent>
      </Card>
      <div className="text-center">
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}