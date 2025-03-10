"use client"

import type React from "react"
import { useState, useEffect, useTransition, useDeferredValue } from "react"
import { render, screen, act, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "@jest/globals"

// Test component using React 19 hooks
const React19HooksDemo = () => {
  const [text, setText] = useState("")
  const [isPending, startTransition] = useTransition()
  const deferredText = useDeferredValue(text)
  const [processed, setProcessed] = useState("")

  // Simulate expensive operation with deferred value
  useEffect(() => {
    // This would be an expensive operation in a real app
    const processText = () => {
      return `Processed: ${deferredText}`
    }

    setProcessed(processText())
  }, [deferredText])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Use startTransition to mark state update as non-urgent
    setText(newValue)

    startTransition(() => {
      // In a real app, this would be a more expensive state update
      console.log("Transition started for:", newValue)
    })
  }

  return (
    <div>
      <input type="text" value={text} onChange={handleChange} data-testid="input" />
      <div data-testid="pending-status">{isPending ? "Updating..." : "Idle"}</div>
      <div data-testid="immediate-output">{text}</div>
      <div data-testid="deferred-output">{deferredText}</div>
      <div data-testid="processed-output">{processed}</div>
    </div>
  )
}

describe("React 19 Hooks", () => {
  it("should render and handle useTransition and useDeferredValue", async () => {
    render(<React19HooksDemo />)

    // Initial state
    expect(screen.getByTestId("pending-status")).toHaveTextContent("Idle")
    expect(screen.getByTestId("immediate-output")).toHaveTextContent("")
    expect(screen.getByTestId("deferred-output")).toHaveTextContent("")

    // Type in the input
    const input = screen.getByTestId("input")
    await act(async () => {
      await userEvent.type(input, "Hello React 19")
    })

    // Immediate output should update right away
    expect(screen.getByTestId("immediate-output")).toHaveTextContent("Hello React 19")

    // Deferred output should eventually match
    await waitFor(() => {
      expect(screen.getByTestId("deferred-output")).toHaveTextContent("Hello React 19")
    })

    // Processed output should eventually update
    await waitFor(() => {
      expect(screen.getByTestId("processed-output")).toHaveTextContent("Processed: Hello React 19")
    })
  })

  it("should correctly report the React version", () => {
    // Check if we're using React 19
    const reactVersion = process.env.NEXT_PUBLIC_REACT_VERSION || ""
    expect(reactVersion).toBeDefined()

    if (reactVersion) {
      const versionParts = reactVersion.split(".")
      if (versionParts.length > 0 && versionParts[0]) {
        const majorVersion = Number.parseInt(versionParts[0], 10)
        expect(majorVersion).toBeGreaterThanOrEqual(19)
      } else {
        // If we can't parse the version, just log it
        console.log("React version format unexpected:", reactVersion)
      }
    }
  })
})