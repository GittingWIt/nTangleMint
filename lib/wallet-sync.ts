"use client"

// This file handles wallet synchronization and component tracking for the nTangleMint application
import { useEffect, useState } from "react"
import { debug } from "@/lib/debug"

// Type definitions
type Subscriber = (data: any) => void
type Unsubscribe = () => void
type WalletData = any // Replace with your actual wallet data type

/**
 * Track component mount for Fast Refresh detection
 */
export function trackComponentMount() {
  debug("Component mounted - tracking for wallet sync")
  return true
}

/**
 * State container for wallet data with pub/sub functionality
 */
class WalletStateContainer {
  private subscribers: Subscriber[] = []
  private currentState: WalletData = null
  private initialized = false

  constructor() {
    // Initialize state from storage on creation
    if (typeof window !== "undefined") {
      this.loadFromStorage()
      this.initialized = true
      debug("WalletStateContainer initialized with data:", this.currentState ? "Found wallet data" : "No wallet data")
    }
  }

  /**
   * Subscribe to wallet state changes
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: Subscriber): Unsubscribe {
    this.subscribers.push(callback)

    // If we already have state, immediately notify the new subscriber
    if (this.currentState) {
      callback(this.currentState)
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  /**
   * Update the wallet state and notify subscribers
   * @param newState - New wallet state
   */
  update(newState: WalletData) {
    this.currentState = newState

    // Notify all subscribers
    this.subscribers.forEach((callback) => {
      callback(newState)
    })

    // Sync to local storage
    this.syncToStorage(newState)
  }

  /**
   * Sync wallet data to local storage
   * @param walletData - Wallet data to sync
   */
  private syncToStorage(walletData: WalletData) {
    if (typeof window === "undefined") return

    const storagePrefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_"
    const shouldResetStorage = process.env.NEXT_PUBLIC_RESET_STORAGE === "true"

    // Check if we should reset storage before syncing
    if (shouldResetStorage) {
      debug("RESET_STORAGE is true, clearing existing wallet data")
      localStorage.removeItem(`${storagePrefix}wallet`)
    }

    // Store the wallet data
    if (walletData) {
      localStorage.setItem(`${storagePrefix}wallet`, JSON.stringify(walletData))
      debug("Wallet data synchronized to local storage")
    }
  }

  /**
   * Load wallet data from local storage
   */
  loadFromStorage() {
    if (typeof window === "undefined") return null

    const storagePrefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_"
    const walletKey = `${storagePrefix}wallet`

    // Try the new format first
    let walletData = localStorage.getItem(walletKey)

    // If not found, try the old format (without underscore)
    if (!walletData) {
      walletData = localStorage.getItem(`${storagePrefix.replace(/_$/, "")}wallet`)
      debug("Trying legacy wallet key format")
    }

    // Also try the default key as a fallback
    if (!walletData && storagePrefix !== "ntanglemint_") {
      walletData = localStorage.getItem("ntanglemint_wallet")
      debug("Trying default wallet key as fallback")
    }

    if (walletData) {
      try {
        const parsedData = JSON.parse(walletData)
        this.currentState = parsedData
        debug("Loaded wallet data from storage:", {
          type: parsedData.type,
          address: parsedData.publicAddress?.substring(0, 8) + "...",
        })
        return parsedData
      } catch (error) {
        console.error("Error parsing wallet data from storage:", error)
      }
    } else {
      debug("No wallet data found in storage")
    }

    return null
  }

  /**
   * Clear all wallet data
   */
  clear() {
    if (typeof window === "undefined") return

    const storagePrefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "ntanglemint_"
    localStorage.removeItem(`${storagePrefix}wallet`)
    this.currentState = null

    // Notify subscribers that data was cleared
    this.subscribers.forEach((callback) => {
      callback(null)
    })

    debug("Wallet data cleared from local storage")
  }

  /**
   * Get wallet data from storage
   * @param includePrivate - Whether to include private key in the returned data
   * @returns The wallet data
   */
  getWalletData(includePrivate = false) {
    // If not initialized yet, load from storage
    if (!this.initialized && typeof window !== "undefined") {
      this.loadFromStorage()
      this.initialized = true
    }

    // If we still don't have data, return null
    if (!this.currentState) {
      return null
    }

    // If includePrivate is false, strip out private key for security
    if (!includePrivate && this.currentState && this.currentState.privateKey) {
      const { privateKey, ...publicData } = this.currentState
      return publicData
    }

    return this.currentState
  }

  /**
   * Wait for wallet initialization with timeout
   * @param timeout - Timeout in milliseconds
   * @returns Promise that resolves when wallet is initialized or rejects on timeout
   */
  waitForInit(timeout = 2000) {
    return new Promise((resolve, reject) => {
      // If we already have state, resolve immediately
      if (this.currentState) {
        resolve(this.currentState)
        return
      }

      // Set up a timeout
      const timeoutId = setTimeout(() => {
        reject(new Error("Wallet initialization timeout"))
      }, timeout)

      // Set up a subscription that will resolve when state is available
      const unsubscribe = this.subscribe((state) => {
        if (state) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve(state)
        }
      })
    })
  }
}

// Create and export a singleton instance of the wallet state
export const walletState = new WalletStateContainer()

/**
 * Hook to use wallet state in components
 */
export function useWalletState() {
  const [state, setState] = useState(walletState.getWalletData())

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletState.subscribe((newState) => {
      setState(newState)
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  return {
    walletData: state,
    updateWallet: (newData: WalletData) => walletState.update(newData),
    clearWallet: () => walletState.clear(),
  }
}

// Legacy functions for backward compatibility
export function syncWalletData(walletData: WalletData) {
  walletState.update(walletData)
}

export function getWalletData() {
  return walletState.getWalletData()
}

export function clearWalletData() {
  walletState.clear()
}

/**
 * Export wallet data to a file
 * @returns The wallet data as a JSON string
 */
export function exportWallet() {
  const walletData = walletState.getWalletData(true)
  if (!walletData) {
    console.error("No wallet data to export")
    return null
  }

  // Create a JSON string of the wallet data
  const walletJson = JSON.stringify(walletData, null, 2)

  // Create a blob and download link
  const blob = new Blob([walletJson], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  // Create and trigger download
  const a = document.createElement("a")
  a.href = url
  a.download = `ntanglemint-wallet-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()

  // Cleanup
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return walletJson
}

/**
 * Import wallet data from a JSON string
 * @param walletJson - JSON string containing wallet data
 * @returns The imported wallet data
 */
export function importWallet(walletJson: string) {
  try {
    const walletData = JSON.parse(walletJson)
    walletState.update(walletData)
    debug("Wallet data imported successfully")
    return walletData
  } catch (error) {
    console.error("Error importing wallet data:", error)
    return null
  }
}

/**
 * Create a consistent wallet with default values
 * @returns The newly created wallet data
 */
export function createConsistentWallet() {
  const defaultMerchant = process.env.NEXT_PUBLIC_DEFAULT_MERCHANT || "ntanglemint_merchant"
  const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE || "mainnet"

  // Create a new wallet with consistent default values
  const newWallet = {
    id: `${defaultMerchant}_${Date.now()}`,
    type: "merchant",
    network: networkMode,
    createdAt: new Date().toISOString(),
    programs: [],
    balance: 0,
    // Add any other required wallet properties
  }

  // Update the wallet state
  walletState.update(newWallet)
  debug("Created new consistent wallet")

  return newWallet
}