"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ErrorBoundary from "@/components/ErrorBoundary"
import { AlertCircle, CheckCircle } from "lucide-react"

export function DiagnosticTest() {
  const [testResults, setTestResults] = useState<{
    localStorage: boolean
    indexedDB: boolean
    serviceWorker: boolean
    webWorker: boolean
  }>({
    localStorage: false,
    indexedDB: false,
    serviceWorker: false,
    webWorker: false,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setError(null)

    try {
      // Test localStorage
      const localStorageTest = testLocalStorage()

      // Test IndexedDB
      const indexedDBTest = await testIndexedDB()

      // Test Service Worker
      const serviceWorkerTest = await testServiceWorker()

      // Test Web Worker
      const webWorkerTest = await testWebWorker()

      setTestResults({
        localStorage: localStorageTest,
        indexedDB: indexedDBTest,
        serviceWorker: serviceWorkerTest,
        webWorker: webWorkerTest,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsRunning(false)
    }
  }

  const testLocalStorage = (): boolean => {
    try {
      localStorage.setItem("test", "test")
      const value = localStorage.getItem("test")
      localStorage.removeItem("test")
      return value === "test"
    } catch {
      return false
    }
  }

  const testIndexedDB = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("testDB", 1)
        request.onerror = () => resolve(false)
        request.onsuccess = () => {
          const db = request.result
          db.close()
          indexedDB.deleteDatabase("testDB")
          resolve(true)
        }
      } catch {
        resolve(false)
      }
    })
  }

  const testServiceWorker = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!("serviceWorker" in navigator)) {
        resolve(false)
        return
      }
      resolve(true)
    })
  }

  const testWebWorker = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!window.Worker) {
        resolve(false)
        return
      }
      resolve(true)
    })
  }

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Browser Compatibility Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>LocalStorage</span>
              {testResults.localStorage ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>IndexedDB</span>
              {testResults.indexedDB ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Service Worker</span>
              {testResults.serviceWorker ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Web Worker</span>
              {testResults.webWorker ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300" />
              )}
            </div>
          </div>

          <Button onClick={runTests} disabled={isRunning} className="w-full">
            {isRunning ? "Running Tests..." : "Run Compatibility Tests"}
          </Button>
        </CardContent>
      </Card>
    </ErrorBoundary>
  )
}

export default DiagnosticTest