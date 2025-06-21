"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Program } from "@/types"
import { useState } from "react"

interface DebugPanelProps {
  program: Program
  updateProgram: (program: Program) => Promise<void>
  products: any[]
}

export function DebugPanel({ program, updateProgram, products }: DebugPanelProps) {
  const [open, setOpen] = useState(false)
  const [testUpc, setTestUpc] = useState("")
  const [loading, setLoading] = useState(false)

  if (!program) {
    return null
  }

  const addTestProductsToProgram = async () => {
    setLoading(true)
    const testProducts = products.slice(0, 5)

    testProducts.forEach((product) => {
      if (
        product.upc &&
        program.metadata &&
        program.metadata.upcCodes &&
        !program.metadata.upcCodes.includes(product.upc)
      ) {
        program.metadata.upcCodes.push(product.upc)
      }
    })

    await updateProgram(program)
    setLoading(false)
  }

  const fixUpcCodes = async () => {
    setLoading(true)
    let addedCount = 0

    products.forEach((product) => {
      if (
        product.upc &&
        program.metadata &&
        program.metadata.upcCodes &&
        !program.metadata.upcCodes.includes(product.upc)
      ) {
        program.metadata.upcCodes.push(product.upc)
        addedCount++
      }
    })

    alert(`Added ${addedCount} UPC codes`)
    await updateProgram(program)
    setLoading(false)
  }

  const addTestData = async () => {
    setLoading(true)
    const testUpcCodes = ["1234567890", "0987654321", "1122334455"]
    let addedUpcCount = 0

    testUpcCodes.forEach((upc) => {
      if (program.metadata && program.metadata.upcCodes && !program.metadata.upcCodes.includes(upc)) {
        program.metadata.upcCodes.push(upc)
        addedUpcCount++
      }
    })

    alert(`Added ${addedUpcCount} test UPC codes`)
    await updateProgram(program)
    setLoading(false)
  }

  const addSingleTestUpc = async () => {
    setLoading(true)

    if (program.metadata && program.metadata.upcCodes && !program.metadata.upcCodes.includes(testUpc)) {
      program.metadata.upcCodes.push(testUpc)
    }

    await updateProgram(program)
    setLoading(false)
    setTestUpc("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Debug Panel</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Debug Panel</DialogTitle>
          <DialogDescription>This panel is for debugging purposes only. Use with caution.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={addTestProductsToProgram} disabled={loading}>
            Add 5 Test Products
          </Button>
          <Button onClick={fixUpcCodes} disabled={loading}>
            Fix UPC Codes
          </Button>
          <Button onClick={addTestData} disabled={loading}>
            Add Test Data
          </Button>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="upc" className="text-right">
              UPC
            </Label>
            <Input id="upc" value={testUpc} onChange={(e) => setTestUpc(e.target.value)} className="col-span-3" />
          </div>
          <Button onClick={addSingleTestUpc} disabled={loading}>
            Add Single Test UPC
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}