"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ErrorBoundary } from "@/components/ui/error-boundary"

// Debug logging utility
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[DiagnosticTest] ${message}`, data || "")
  }
}

export default function DiagnosticTest() {
  const [basicButtonClicks, setBasicButtonClicks] = useState(0)
  const [dropdownWithAsChildClicks, setDropdownWithAsChildClicks] = useState(0)
  const [dropdownWithoutAsChildClicks, setDropdownWithoutAsChildClicks] = useState(0)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [dropdownWithAsChildOpen, setDropdownWithAsChildOpen] = useState(false)
  const [dropdownWithoutAsChildOpen, setDropdownWithoutAsChildOpen] = useState(false)
  const [dropdownWithAsChildWasOpened, setDropdownWithAsChildWasOpened] = useState(false)
  const [dropdownWithoutAsChildWasOpened, setDropdownWithoutAsChildWasOpened] = useState(false)

  const handleBasicButtonClick = useCallback(() => {
    debugLog("Basic button clicked")
    setBasicButtonClicks((prev) => prev + 1)
  }, [])

  const handleDropdownStateChange = useCallback((open: boolean, type: "withAsChild" | "withoutAsChild") => {
    debugLog(`Dropdown ${type} state changed`, { open })
    if (type === "withAsChild") {
      setDropdownWithAsChildOpen(open)
      if (open) {
        setDropdownWithAsChildClicks((prev) => prev + 1)
        setDropdownWithAsChildWasOpened(true)
      }
    } else {
      setDropdownWithoutAsChildOpen(open)
      if (open) {
        setDropdownWithoutAsChildClicks((prev) => prev + 1)
        setDropdownWithoutAsChildWasOpened(true)
      }
    }
  }, [])

  const handleItemSelect = useCallback((item: string) => {
    debugLog("Item selected", { item })
    setSelectedItem(item)
  }, [])

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <div className="space-y-4 border p-4 rounded-md">
          <h2 className="text-xl font-semibold">Test 1: Basic Button</h2>
          <div className="space-y-2">
            <Button onClick={handleBasicButtonClick}>Basic Button</Button>
            <p className="text-sm text-muted-foreground">Button clicked: {basicButtonClicks} times</p>
          </div>
        </div>

        <div className="space-y-4 border p-4 rounded-md">
          <h2 className="text-xl font-semibold">Test 2: DropdownMenu with asChild=true</h2>
          <div className="space-y-2">
            <DropdownMenu
              open={dropdownWithAsChildOpen}
              onOpenChange={(open) => handleDropdownStateChange(open, "withAsChild")}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown with asChild ({dropdownWithAsChildClicks} clicks)</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Test Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleItemSelect("With asChild: Item 1")}>Item 1</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleItemSelect("With asChild: Item 2")}>Item 2</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4 border p-4 rounded-md">
          <h2 className="text-xl font-semibold">Test 3: DropdownMenu without asChild</h2>
          <div className="space-y-2">
            <DropdownMenu
              open={dropdownWithoutAsChildOpen}
              onOpenChange={(open) => handleDropdownStateChange(open, "withoutAsChild")}
            >
              <DropdownMenuTrigger>
                Dropdown without asChild ({dropdownWithoutAsChildClicks} clicks)
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Test Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleItemSelect("Without asChild: Item 1")}>Item 1</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleItemSelect("Without asChild: Item 2")}>Item 2</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h2 className="text-lg font-semibold text-green-800">Test Results:</h2>
          <ul className="list-disc pl-5 space-y-2 text-green-700">
            <li>Basic Button: {basicButtonClicks > 0 ? "Working ✅" : "Not clicked yet"}</li>
            <li>Dropdown Button (with asChild): {dropdownWithAsChildClicks > 0 ? "Working ✅" : "Not clicked yet"}</li>
            <li>
              Dropdown Button (without asChild): {dropdownWithoutAsChildClicks > 0 ? "Working ✅" : "Not clicked yet"}
            </li>
            <li>Dropdown Menu (with asChild): {dropdownWithAsChildWasOpened ? "Can open ✅" : "Not opened yet"}</li>
            <li>
              Dropdown Menu (without asChild): {dropdownWithoutAsChildWasOpened ? "Can open ✅" : "Not opened yet"}
            </li>
            {selectedItem && <li>Last Selected Item: {selectedItem} ✅</li>}
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  )
}