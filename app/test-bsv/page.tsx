import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/test-bsv/wallet-lifecycle">Wallet Lifecycle</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/test-bsv/wallet-creation">Wallet Creation</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/test-bsv/wallet-restore">Wallet Restore</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/test-bsv/program-creation">Program Creation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}