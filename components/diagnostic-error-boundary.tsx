"use client"

import * as React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export class DiagnosticErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error("DiagnosticTest Error:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            An error occurred in the diagnostic test. Please refresh the page and try again.
            {process.env.NODE_ENV === "development" && <pre className="mt-2 text-xs">{this.state.error?.message}</pre>}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}