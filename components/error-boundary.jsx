"use client"

import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({
      errorInfo,
    })
  }

  handleReset = () => {
    try {
      // Clear any error state
      this.setState({ hasError: false, error: null, errorInfo: null })
      window.location.reload()
    } catch (err) {
      console.error("Error during reset:", err)
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="max-w-md p-4 border border-red-500 rounded-md bg-red-50">
            <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h2>
            <div className="mt-2">
              <div className="text-sm space-y-2">
                <p>{this.state.error?.message}</p>
                {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                  <pre className="text-xs text-left p-2 bg-gray-100 rounded-md overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reset and try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary