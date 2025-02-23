"use client"

import type React from "react"
import { Component, type ErrorInfo } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { clearWalletData } from "@/lib/storage"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({
      errorInfo,
    })
  }

  handleReset = async () => {
    try {
      // Clear wallet data before resetting
      await clearWalletData()
      this.setState({ hasError: false, error: null, errorInfo: null })
      window.location.reload()
    } catch (err) {
      console.error("Error during reset:", err)
      // Force reload if clearing wallet data fails
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="text-sm space-y-2">
                <p>{this.state.error?.message}</p>
                {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                  <pre className="text-xs text-left p-2 bg-secondary/50 rounded-md overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={this.handleReset} className="mt-4">
            Reset and try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}