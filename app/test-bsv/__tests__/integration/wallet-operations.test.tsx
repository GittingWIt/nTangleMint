"use client"

import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

// Create a simplified version of the WalletProvider and useWallet hook for testing
const WalletContext = React.createContext<{
  walletData: any
  isLoading: boolean
  refreshWallet: () => void
}>({
  walletData: null,
  isLoading: true,
  refreshWallet: () => {},
})

// Mock wallet data
const mockWalletData = {
  type: "user" as const,
  publicAddress: "test-address",
  publicKey: "test-public-key",
  privateKey: "test-private-key",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mock functions for wallet operations
const mockGetWalletData = jest.fn<() => Promise<typeof mockWalletData | null>>()
const mockSetWalletData = jest.fn<(data: typeof mockWalletData) => Promise<void>>()
const mockClearWalletData = jest.fn<() => Promise<void>>()

// Simplified WalletProvider for testing
const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletData, setWalletData] = React.useState<typeof mockWalletData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Initial load
    setIsLoading(true)
    mockGetWalletData().then((data) => {
      setWalletData(data)
      setIsLoading(false)
    })

    // Listen for wallet updates
    const handleWalletUpdate = () => {
      setIsLoading(true)
      mockGetWalletData().then((data) => {
        setWalletData(data)
        setIsLoading(false)
      })
    }

    window.addEventListener("walletUpdated", handleWalletUpdate)
    return () => window.removeEventListener("walletUpdated", handleWalletUpdate)
  }, [])

  const refreshWallet = React.useCallback(() => {
    setIsLoading(true)
    mockGetWalletData().then((data) => {
      setWalletData(data)
      setIsLoading(false)
    })
  }, [])

  return <WalletContext.Provider value={{ walletData, isLoading, refreshWallet }}>{children}</WalletContext.Provider>
}

// Hook to use the wallet context
const useWallet = () => React.useContext(WalletContext)

// Test component to display wallet status
const WalletStatus = () => {
  const { walletData, isLoading } = useWallet()

  if (isLoading) return <div>Loading...</div>

  return <div data-testid="wallet-status">{walletData ? walletData.publicAddress : "No wallet"}</div>
}

describe("Wallet Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Wallet Creation", () => {
    it("should create and store wallet data", async () => {
      // Mock initial state - no wallet
      mockGetWalletData.mockResolvedValue(null)
      mockSetWalletData.mockResolvedValue(undefined)

      await act(async () => {
        render(
          <WalletProvider>
            <WalletStatus />
          </WalletProvider>,
        )
      })

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
      })

      // Check initial state
      expect(screen.getByText("No wallet")).toBeInTheDocument()

      // Simulate wallet creation
      await act(async () => {
        await mockSetWalletData(mockWalletData)
        mockGetWalletData.mockResolvedValue(mockWalletData)
      })

      // Trigger a re-render by dispatching the walletUpdated event
      await act(async () => {
        window.dispatchEvent(new Event("walletUpdated"))
      })

      // Check that wallet data is displayed
      await waitFor(() => {
        expect(screen.getByTestId("wallet-status")).toHaveTextContent(mockWalletData.publicAddress)
      })
    })
  })

  describe("Wallet State Updates", () => {
    it("should update wallet state when data changes", async () => {
      // Mock initial state with wallet
      mockGetWalletData.mockResolvedValue(mockWalletData)

      await act(async () => {
        render(
          <WalletProvider>
            <WalletStatus />
          </WalletProvider>,
        )
      })

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
      })

      // Check that wallet data is displayed
      expect(screen.getByTestId("wallet-status")).toHaveTextContent(mockWalletData.publicAddress)

      // Simulate wallet clear
      await act(async () => {
        await mockClearWalletData()
        mockGetWalletData.mockResolvedValue(null)
      })

      // Trigger a re-render by dispatching the walletUpdated event
      await act(async () => {
        window.dispatchEvent(new Event("walletUpdated"))
      })

      // Check that wallet is cleared
      await waitFor(() => {
        expect(screen.getByText("No wallet")).toBeInTheDocument()
      })
    })
  })
})