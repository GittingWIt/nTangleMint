// Import the fix at the very top of the file
import "@/lib/global-functions"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logDiagnostics, getEnvironmentInfo } from "@/lib/diagnostic-utils"

// Log diagnostic information during build
logDiagnostics("punch-card/page.tsx", {
  buildTime: new Date().toISOString(),
  environment: getEnvironmentInfo(),
})

export default function PunchCardPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Punch Card Program</h1>
        <p className="text-muted-foreground">Create a new punch card program for your customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Punch Card Details</CardTitle>
          <CardDescription>Fill out the form below to create a new punch card program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The form is temporarily unavailable while we resolve some technical issues.
          </p>

          <div className="flex justify-end space-x-4">
            <Link href="/merchant/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}