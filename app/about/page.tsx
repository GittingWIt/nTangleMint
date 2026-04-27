"use client"

import { Blocks, Shield, Star, Gift, ArrowRight, Heart, Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useWallet } from "@/contexts/wallet-context"

export default function AboutPage() {
  const { wallet } = useWallet()
  
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-6xl font-bold text-foreground mb-8 text-balance">
              Loyalty Reimagined
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty leading-relaxed">
              We&apos;re building the future of loyalty programs—where blockchain technology empowers businesses and customers alike to create meaningful, transparent relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28 bg-primary/5 border-t border-b border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Our Mission</h2>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                We are reimagining loyalty programs and standing at the forefront of autonomous philanthropy. Our mission is to democratize rewards infrastructure, making it accessible to businesses of all sizes while creating a more equitable ecosystem for customer engagement.
              </p>
              
              <p>
                At nTangleMint, we believe loyalty shouldn&apos;t be complicated or easily lost. By leveraging blockchain technology on BSV, we&apos;ve created a system where every punch card, every reward, and every transaction is permanent, transparent, and secure. This isn&apos;t just about points—it&apos;s about building trust.
              </p>
              
              <p>
                Our vision extends beyond commerce. We&apos;re enabling autonomous philanthropy by allowing loyalty programs to directly fund causes and communities. When businesses reward customers, those rewards can ripple through the ecosystem, creating positive social impact while maintaining complete transparency on the blockchain. Customers can participate in programs knowing their loyalty contributes to meaningful change.
              </p>
              
              <p>
                We&apos;re here to prove that technology can make the world more connected, more trustworthy, and more rewarding for everyone involved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">Our Values</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <div className="p-8 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Blocks className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Transparency</h3>
              <p className="text-muted-foreground text-sm">
                Every transaction is recorded immutably on the blockchain. No hidden fees, no lost records.
              </p>
            </div>

            {/* Value 2 */}
            <div className="p-8 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Impact</h3>
              <p className="text-muted-foreground text-sm">
                Loyalty programs that reward customers and fund meaningful causes in their communities.
              </p>
            </div>

            {/* Value 3 */}
            <div className="p-8 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Simplicity</h3>
              <p className="text-muted-foreground text-sm">
                Powerful blockchain technology shouldn&apos;t be complicated. We make it intuitive and accessible.
              </p>
            </div>

            {/* Value 4 */}
            <div className="p-8 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Accessibility</h3>
              <p className="text-muted-foreground text-sm">
                Open to everyone, from small local businesses to global enterprises seeking loyalty innovation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminology Section */}
      <section className="py-20 md:py-28 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-16 text-center">Our Terminology</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background rounded-xl border p-8 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Blocks className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">nTangleMint</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The moment when the business relationship between Customer and Merchant is established for a specific program - triggered by the first transaction.
              </p>
            </div>

            <div className="bg-background rounded-xl border p-8 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">nTwined Block</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The first Punch Block with an executed transaction. It only becomes nTwined when the nTangled Transaction is executed.
              </p>
            </div>

            <div className="bg-background rounded-xl border p-8 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">Redeemed Block</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The last Punch Block where the earned reward is recognized and fulfilled. Only costs a mining fee - no value transfer.
              </p>
            </div>

            <div className="bg-background rounded-xl border p-8 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-3 text-lg">Minterest</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a customer is interested in a program but hasn&apos;t gone through nTangleMint yet. Acts as a queue with no blockchain transaction required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Flow */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-16 text-center">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-6 p-6 bg-muted/50 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">nTangled Transaction</h3>
                <p className="text-muted-foreground">
                  The first transaction that establishes the relationship. Creates the NFT/UTXO in the customer&apos;s wallet, permanently recording the loyalty relationship on blockchain.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 bg-muted/50 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Punch Transactions</h3>
                <p className="text-muted-foreground">
                  Each subsequent purchase stamps a Punch Block. Sequential order is enforced on the blockchain, ensuring accuracy and preventing fraud.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 bg-muted/50 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Redeemed Transaction</h3>
                <p className="text-muted-foreground">
                  The final transaction that fulfills the reward. Only costs a mining fee, making reward redemption economically viable for businesses of all sizes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 md:py-28 bg-primary/5 border-t border-b border-primary/10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Built on Blockchain</h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              We&apos;ve chosen BSV (Bitcoin SV) blockchain as the foundation for nTangleMint because of its scalability, cost-efficiency, and commitment to immutability. Every loyalty transaction is permanently recorded on a decentralized network, ensuring that customer rewards can never be lost or arbitrarily altered.
            </p>
            
            <p>
              This infrastructure allows us to offer micro-transactions at near-zero cost, making it economically viable for businesses of any size to run transparent loyalty programs. The blockchain becomes a shared ledger of trust between merchants, customers, and the community.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show if wallet is NOT connected */}
      {!wallet && (
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Be part of the next generation of loyalty programs powered by blockchain technology and autonomous philanthropy.
            </p>
            <Link href="/wallet">
              <Button size="lg" className="gap-2">
                Start Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}