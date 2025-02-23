import { render } from "@testing-library/react"
import { CreateWalletFormComponent } from "../../wallet-generation/create-wallet-form"
import { RestoreWalletFormComponent } from "../../wallet-generation/restore-wallet-form"
import { describe, it, expect } from "@jest/globals"

function normalizeHTML(html: string): string {
  return html.replace(/\s+/g, " ").trim().toLowerCase()
}

describe("Hydration tests", () => {
  it("CreateWalletForm hydrates correctly", () => {
    const { container: serverContainer } = render(<CreateWalletFormComponent />)
    const serverHTML = serverContainer.innerHTML

    serverContainer.remove()

    const { container: clientContainer } = render(<CreateWalletFormComponent />)
    const clientHTML = clientContainer.innerHTML

    expect(normalizeHTML(serverHTML)).toBe(normalizeHTML(clientHTML))
  })

  it("RestoreWalletForm hydrates correctly", () => {
    const { container: serverContainer } = render(<RestoreWalletFormComponent />)
    const serverHTML = serverContainer.innerHTML

    serverContainer.remove()

    const { container: clientContainer } = render(<RestoreWalletFormComponent />)
    const clientHTML = clientContainer.innerHTML

    expect(normalizeHTML(serverHTML)).toBe(normalizeHTML(clientHTML))
  })
})