import { render, screen, fireEvent } from "@testing-library/react"
import { RefComponent } from "@/components/RefComponent"
import { describe, it, expect } from "@jest/globals"

describe("Ref Handling", () => {
  it("should update the input value when the button is clicked", () => {
    render(<RefComponent />)
    const inputElement = screen.getByRole("textbox")
    const buttonElement = screen.getByRole("button")

    fireEvent.change(inputElement, { target: { value: "test" } })
    fireEvent.click(buttonElement)

    expect(screen.getByText("test")).toBeInTheDocument()
  })

  it("should focus the input element when the button is clicked", () => {
    render(<RefComponent />)
    const inputElement = screen.getByRole("textbox")
    const buttonElement = screen.getByRole("button")

    fireEvent.click(buttonElement)

    expect(document.activeElement).toBe(inputElement)
  })

  it("should display the correct message when the input value is changed", () => {
    render(<RefComponent />)
    const inputElement = screen.getByRole("textbox")

    fireEvent.change(inputElement, { target: { value: "test" } })

    expect(screen.getByText("test")).toBeInTheDocument()
  })
})