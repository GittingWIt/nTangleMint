import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import * as React from "react"

describe("Button Component", () => {
  describe("asChild prop", () => {
    it("should render as a Slot component when asChild is true", () => {
      const { container } = render(
        <Button asChild>
          <a href="#">Link Button</a>
        </Button>,
      )

      const link = screen.getByRole("link")
      expect(link).toBeInTheDocument()
      expect(link).toHaveTextContent("Link Button")
      expect(container.querySelector("button")).not.toBeInTheDocument()
    })

    it("should render as a button when asChild is false", () => {
      render(<Button>Normal Button</Button>)
      expect(screen.getByRole("button")).toBeInTheDocument()
    })
  })

  describe("Event Propagation", () => {
    it("should handle click events correctly", () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)

      fireEvent.click(screen.getByText("Click Me"))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it("should handle nested event propagation", () => {
      const parentClick = jest.fn()
      const buttonClick = jest.fn()

      render(
        <div onClick={parentClick}>
          <Button onClick={buttonClick}>Nested Button</Button>
        </div>,
      )

      fireEvent.click(screen.getByText("Nested Button"))
      expect(buttonClick).toHaveBeenCalledTimes(1)
      expect(parentClick).toHaveBeenCalledTimes(1)
    })
  })

  describe("Ref Forwarding", () => {
    it("should forward refs correctly", () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Ref Button</Button>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.textContent).toBe("Ref Button")
    })

    it("should forward refs with asChild", () => {
      const ref = React.createRef<HTMLAnchorElement>()
      render(
        <Button asChild>
          <a href="#" ref={ref}>
            Link with Ref
          </a>
        </Button>,
      )

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
    })
  })

  describe("Variants and Sizes", () => {
    it("should render all variants correctly", () => {
      const variants = ["default", "destructive", "outline", "secondary", "ghost", "link"] as const

      variants.forEach((variant) => {
        const { container } = render(<Button variant={variant}>Button</Button>)
        // Check for the presence of variant-specific classes instead of a single class
        if (variant === "default") {
          expect(container.firstChild).toHaveClass("bg-primary")
        } else if (variant === "destructive") {
          expect(container.firstChild).toHaveClass("bg-destructive")
        } else if (variant === "outline") {
          expect(container.firstChild).toHaveClass("border")
          expect(container.firstChild).toHaveClass("border-input")
        } else if (variant === "secondary") {
          expect(container.firstChild).toHaveClass("bg-secondary")
        } else if (variant === "ghost") {
          expect(container.firstChild).toHaveClass("hover:bg-accent")
        } else if (variant === "link") {
          expect(container.firstChild).toHaveClass("text-primary")
          expect(container.firstChild).toHaveClass("underline-offset-4")
        }
      })
    })

    it("should render all sizes correctly", () => {
      const sizes = ["default", "sm", "lg", "icon"] as const

      sizes.forEach((size) => {
        const { container } = render(<Button size={size}>Button</Button>)
        // Check for the presence of size-specific classes instead of a single class
        if (size === "default") {
          expect(container.firstChild).toHaveClass("h-10")
          expect(container.firstChild).toHaveClass("px-4")
          expect(container.firstChild).toHaveClass("py-2")
        } else if (size === "sm") {
          expect(container.firstChild).toHaveClass("h-9")
          expect(container.firstChild).toHaveClass("rounded-md")
          expect(container.firstChild).toHaveClass("px-3")
        } else if (size === "lg") {
          expect(container.firstChild).toHaveClass("h-11")
          expect(container.firstChild).toHaveClass("rounded-md")
          expect(container.firstChild).toHaveClass("px-8")
        } else if (size === "icon") {
          expect(container.firstChild).toHaveClass("h-10")
          expect(container.firstChild).toHaveClass("w-10")
        }
      })
    })
  })
})