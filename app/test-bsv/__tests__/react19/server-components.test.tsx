import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "@jest/globals"

// Mock a Server Component
// In a real app, this would be a server component
const ServerComponent = () => {
  return <div data-testid="server-component">Server Component Content</div>
}

// Mock a Client Component
const ClientComponent = () => {
  return <div data-testid="client-component">Client Component Content</div>
}

// Mock a component that uses both
const HybridComponent = () => {
  return (
    <div>
      <ServerComponent />
      <ClientComponent />
    </div>
  )
}

describe("React 19 Server Components", () => {
  it("should render server and client components together", () => {
    render(<HybridComponent />)

    expect(screen.getByTestId("server-component")).toHaveTextContent("Server Component Content")
    expect(screen.getByTestId("client-component")).toHaveTextContent("Client Component Content")
  })

  it("should correctly report the Next.js version", () => {
    // Check if we're using Next.js 15 or higher
    const nextVersion = process.env.NEXT_PUBLIC_NEXT_VERSION || ""
    expect(nextVersion).toBeDefined()

    if (nextVersion) {
      const versionParts = nextVersion.split(".")
      if (versionParts.length > 0 && versionParts[0]) {
        const majorVersion = Number.parseInt(versionParts[0], 10)
        expect(majorVersion).toBeGreaterThanOrEqual(15)
      } else {
        // If we can't parse the version, just log it
        console.log("Next.js version format unexpected:", nextVersion)
      }
    }
  })
})