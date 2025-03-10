"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug } from "lucide-react"

interface DebugFormStateProps {
  formState: any
  walletStatus: string
  isSubmitting: boolean
}

export function DebugFormState({ formState, walletStatus, isSubmitting }: DebugFormStateProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="bg-white shadow-md">
        <Bug className="h-4 w-4 mr-2" />
        Debug Form
      </Button>

      {isOpen && (
        <Card className="absolute bottom-12 right-0 w-80 shadow-lg">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Form Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-xs space-y-1 font-mono">
              <div>
                Wallet Status: <span className="font-bold">{walletStatus}</span>
              </div>
              <div>
                Is Submitting: <span className="font-bold">{isSubmitting.toString()}</span>
              </div>
              <div>
                Form Valid: <span className="font-bold">{formState.isValid.toString()}</span>
              </div>
              <div className="border-t pt-1 mt-1">
                <div className="font-bold">Form Fields:</div>
                {Object.entries(formState).map(([key, value]) => (
                  <div key={key}>
                    {key}: <span className="text-blue-600">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}