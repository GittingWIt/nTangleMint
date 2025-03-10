import { render, screen } from "@testing-library/react"
import { act } from "react-dom/test-utils"
import DiagnosticTest from "@/components/diagnostic-test"
import userEvent from "@testing-library/user-event"

describe("DiagnosticTest Component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe("Basic Button Tests", () => {
    it("should render basic button", () => {
      render(<DiagnosticTest />)
      expect(screen.getByText("Basic Button")).toBeInTheDocument()
    })

    it("should increment click count when basic button is clicked", async () => {
      render(<DiagnosticTest />)
      const button = screen.getByText("Basic Button")

      await act(async () => {
        await userEvent.click(button)
      })

      expect(screen.getByText("Button clicked: 1 times")).toBeInTheDocument()
    })
  })

  describe("Dropdown with asChild Tests", () => {
    it("should render dropdown with asChild", () => {
      render(<DiagnosticTest />)
      expect(screen.getByText(/Dropdown with asChild/)).toBeInTheDocument()
    })

    it("should open dropdown menu and allow item selection", async () => {
      render(<DiagnosticTest />)
      const dropdown = screen.getByText(/Dropdown with asChild/)

      await act(async () => {
        await userEvent.click(dropdown)
      })

      expect(screen.getByText("Test Menu")).toBeInTheDocument()

      const menuItem = screen.getByText("Item 1")
      await act(async () => {
        await userEvent.click(menuItem)
      })

      expect(screen.getByText(/With asChild: Item 1/)).toBeInTheDocument()
    })

    it("should track dropdown open state correctly", async () => {
      render(<DiagnosticTest />)
      const dropdown = screen.getByText(/Dropdown with asChild/)

      await act(async () => {
        await userEvent.click(dropdown)
      })

      expect(screen.getByText("Can open ✅")).toBeInTheDocument()
    })
  })

  describe("Dropdown without asChild Tests", () => {
    it("should render dropdown without asChild", () => {
      render(<DiagnosticTest />)
      expect(screen.getByText(/Dropdown without asChild/)).toBeInTheDocument()
    })

    it("should open dropdown menu and allow item selection", async () => {
      render(<DiagnosticTest />)
      const dropdown = screen.getByText(/Dropdown without asChild/)

      await act(async () => {
        await userEvent.click(dropdown)
      })

      expect(screen.getByText("Test Menu")).toBeInTheDocument()

      const menuItem = screen.getByText("Item 1")
      await act(async () => {
        await userEvent.click(menuItem)
      })

      expect(screen.getByText(/Without asChild: Item 1/)).toBeInTheDocument()
    })

    it("should track dropdown open state correctly", async () => {
      render(<DiagnosticTest />)
      const dropdown = screen.getByText(/Dropdown without asChild/)

      await act(async () => {
        await userEvent.click(dropdown)
      })

      expect(screen.getByText("Can open ✅")).toBeInTheDocument()
    })
  })

  describe("Error Boundary Tests", () => {
    it("should catch and display errors", async () => {
      const ThrowError = () => {
        throw new Error("Test error")
      }

      render(
        <DiagnosticTest>
          <ThrowError />
        </DiagnosticTest>,
      )

      expect(screen.getByText(/An error occurred/)).toBeInTheDocument()
    })
  })
})