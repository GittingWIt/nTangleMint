import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">About nTangleMint</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            At nTangleMint, we're revolutionizing the way businesses and customers interact through innovative loyalty
            programs. Our mission is to create a seamless, engaging, and rewarding experience for both merchants and
            consumers, leveraging the power of blockchain technology and NFTs. By facilitating local partnerships we
            create stronger, more interconnected local economies.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What We Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Customizable loyalty programs for businesses of all sizes</li>
            <li>Secure, blockchain-based reward systems</li>
            <li>NFT-powered loyalty cards for enhanced engagement</li>
            <li>Coalition programs for multi-brand collaborations</li>
            <li>Tiered loyalty systems for increased customer retention</li>
            <li>User-friendly interfaces for both merchants and customers</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Our Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            nTangleMint utilizes cutting-edge blockchain technology, specifically the Bitcoin Satoshi Vision (BSV)
            blockchain, to ensure transparency, security, and efficiency in all our loyalty programs. By leveraging
            NFTs, we create unique, tradeable loyalty tokens that provide real value to customers while offering
            businesses powerful tools for engagement and analytics.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Join Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Whether you're a business looking to enhance your customer loyalty or a consumer eager to maximize your
            rewards, nTangleMint has something for you. Join us in shaping the future of loyalty programs and experience
            the power of blockchain-based rewards today!
          </p>
        </CardContent>
      </Card>

      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
        <p>Email: info@ntanglemint.com</p>
        <p>Phone: (555) 123-4567</p>
        <p>Address: 123 Blockchain Boulevard, Crypto City, CC 12345</p>
      </div>
    </div>
  )
}