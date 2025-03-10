"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { diagnoseProgramCreation } from "@/lib/test/program-creation"
import { Loader2, RefreshCw, Download } from 'lucide-react'

export default function ProgramCreationTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [couponBookId, setCouponBookId] = useState<string>("")

  const runDiagnostics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResults(null)

      console.log("Starting program creation diagnostics...")
      const diagnostics = await diagnoseProgramCreation(couponBookId || undefined)
      
      setResults(diagnostics)
      console.log("Diagnostics results:", diagnostics)
      
      if (!diagnostics.success) {
        setError("Program creation flow has issues. See details below.")
      }
    } catch (err) {
      console.error("Diagnostics failed:", err)
      setError(err instanceof Error ? err.message : "Diagnostics failed")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = () => {
    if (!results) return

    const dataStr = JSON.stringify(results, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `program-creation-diagnostics-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Program Creation Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="couponBookId">Coupon Book ID (optional)</Label>
            <Input 
              id="couponBookId" 
              value={couponBookId} 
              onChange={(e) => setCouponBookId(e.target.value)}
              placeholder="Enter coupon book ID to test with specific book"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to test the default flow without a selected coupon book
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <Alert variant={results.success ? "default" : "warning"} className={results.success ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}>
              <AlertDescription>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Diagnostics Results</span>
                  <Button variant="outline" size="sm" onClick={downloadResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-96 bg-white p-2 rounded border">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Program Creation Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}