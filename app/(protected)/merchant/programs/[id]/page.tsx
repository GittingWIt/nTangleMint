"use client"

import { useState, useEffect } from "react"
import ProgramDetailsClient from "./program-details-client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import type { Program, Product } from "@/types"

// Create a stable debug log function outside the component
const debugLogs: string[] = []
function addToDebugLog(message: string) {
  debugLogs.push(message)
  console.log(message)
}

export default function ProgramDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const programId = params.id as string
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [showDebug] = useState(() => {
    return searchParams.get("debug") === "true"
  })

  // Only run this effect once on mount
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        addToDebugLog("🔍 Looking for program with ID: " + programId)

        // Get programs from localStorage
        const programsStr = localStorage.getItem("programs")
        const programs = programsStr ? JSON.parse(programsStr) : []

        // Find program by ID
        let foundProgram = programs.find((p: Program) => p.id === programId)

        // If not found with exact match, try case-insensitive
        if (!foundProgram) {
          const caseInsensitiveMatch = programs.find(
            (p: Program) => p.id && p.id.toLowerCase() === programId.toLowerCase(),
          )

          if (caseInsensitiveMatch) {
            foundProgram = caseInsensitiveMatch
            addToDebugLog(`✅ Found program with case-insensitive match: ${foundProgram.name}`)
          }
        } else {
          addToDebugLog(`✅ Found program: ${foundProgram.name}`)
        }

        // If program not found, return error
        if (!foundProgram) {
          addToDebugLog("❌ Program not found")
          setError(`Program with ID "${programId}" not found`)
          setLoading(false)
          return
        }

        // Ensure program structure is valid
        if (!foundProgram.metadata) {
          addToDebugLog("⚠️ Program has no metadata, creating empty object")
          foundProgram.metadata = {}
        }

        if (!foundProgram.metadata.upcCodes) {
          addToDebugLog("⚠️ Program has no upcCodes array, creating empty array")
          foundProgram.metadata.upcCodes = []
        } else {
          addToDebugLog(`✅ Program has ${foundProgram.metadata.upcCodes.length} UPC codes`)
        }

        if (!foundProgram.metadata.products) {
          addToDebugLog("⚠️ Program has no products array, creating empty array")
          foundProgram.metadata.products = []
        } else {
          addToDebugLog(`✅ Program has ${foundProgram.metadata.products.length} products in metadata`)
        }

        // Get products for this program (from metadata)
        const programProducts = foundProgram.metadata.products || []
        addToDebugLog(`📦 Final products array: ${programProducts.length} items`)

        // Get UPC codes for this program
        const upcCodes = foundProgram.metadata.upcCodes || []
        addToDebugLog(`🏷️ Found ${upcCodes.length} UPC codes for this program`)

        // Ensure UPC codes from products are added to the program
        programProducts.forEach((product: any) => {
          if (
            product.upc &&
            foundProgram.metadata &&
            foundProgram.metadata.upcCodes &&
            !foundProgram.metadata.upcCodes.includes(product.upc)
          ) {
            foundProgram.metadata.upcCodes.push(product.upc)
            addToDebugLog(`➕ Added UPC code ${product.upc} from product to program's UPC codes`)
          }
        })

        // Save the updated program back to localStorage if UPC codes were added
        const updatedPrograms = programs.map((p: Program) => (p.id === foundProgram.id ? foundProgram : p))
        localStorage.setItem("programs", JSON.stringify(updatedPrograms))
        addToDebugLog("💾 Saved updated program back to localStorage")

        setProducts(programProducts)
        setProgram(foundProgram)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching program:", err)
        addToDebugLog(`❌ Error fetching program: ${err}`)
        setError("Error fetching program details")
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId]) // Only depend on programId

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || `Program not found. ID: ${programId}`}</AlertDescription>
        </Alert>
        <div className="mt-4 p-4 border rounded bg-muted/20">
          <h3 className="font-medium mb-2">Program Not Found</h3>
          <p className="text-sm text-muted-foreground mb-2">The program with ID "{programId}" does not exist.</p>
          <p className="text-sm text-muted-foreground">
            Programs must be created through the program creation interface.
          </p>
        </div>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/merchant/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {showDebug && (
        <div className="container mx-auto p-4 mb-4 bg-muted/20 border rounded">
          <h3 className="font-medium mb-2">Debug Log</h3>
          <div className="p-2 bg-muted rounded-md overflow-auto max-h-40 font-mono text-xs">
            {debugLogs.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      {program ? (
        <ProgramDetailsClient initialProgram={program} initialProducts={products} programId={programId} />
      ) : (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertDescription>Program not found. ID: {programId}</AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/merchant/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      )}
    </>
  )
}