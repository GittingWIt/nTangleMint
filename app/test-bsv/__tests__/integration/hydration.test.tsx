"use client"

import { useState, useEffect } from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect } from "@jest/globals"

// Define the type for initialData
interface InitialData {
  value: string
  [key: string]: any
}

// Simple component that demonstrates hydration
const HydrationExample = ({ initialData }: { initialData: InitialData }) => {
  const [data, setData] = useState<InitialData>(initialData)
  const [hydrated, setHydrated] = useState<boolean>(false)

  useEffect(() => {
    // Mark as hydrated after initial render
    const timer = setTimeout(() => {
      setHydrated(true)

      // Simulate data fetch after hydration
      const fetchData = async () => {
        const result = await Promise.resolve({ ...initialData, updated: true })
        setData(result)
      }

      fetchData()
    }, 100) // Small delay to ensure we can test the initial state

    return () => clearTimeout(timer)
  }, [initialData])

  // Component with hydration indicator
  const ClientComponent = () => {
    const [mounted, setMounted] = useState<boolean>(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    return <div data-testid="client-component">{mounted ? "Client Rendered" : "Server Rendered"}</div>
  }

  return (
    <div>
      <div data-testid="hydration-status">{hydrated ? "Hydrated" : "Not Hydrated"}</div>
      <div data-testid="data-display">{JSON.stringify(data)}</div>
      <ClientComponent />
    </div>
  )
}

describe("Hydration", () => {
  it("should properly hydrate and update state", async () => {
    const initialData: InitialData = { value: "initial" }

    // Use act for the initial render
    await act(async () => {
      render(<HydrationExample initialData={initialData} />)
    })

    // Initially not hydrated - we need to check this immediately
    expect(screen.getByTestId("hydration-status")).toHaveTextContent("Not Hydrated")

    // Wait for hydration
    await waitFor(
      () => {
        expect(screen.getByTestId("hydration-status")).toHaveTextContent("Hydrated")
      },
      { timeout: 1000 },
    )

    // Check that data was updated after hydration
    await waitFor(
      () => {
        expect(screen.getByTestId("data-display")).toHaveTextContent("updated")
      },
      { timeout: 1000 },
    )

    // Check that client component is client rendered
    expect(screen.getByTestId("client-component")).toHaveTextContent("Client Rendered")
  })
})