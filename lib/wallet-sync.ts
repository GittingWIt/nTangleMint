// Enhanced wallet state synchronization with Fast Refresh support
import { debug } from "./debug"
import type { WalletData } from "@/types"

// Singleton state container with Fast Refresh resilience
class WalletStateContainer {
  private static instance: WalletStateContainer
  private _walletData: WalletData | null = null
  private _isInitialized = false
  private _initPromise: Promise<void> | null = null
  private _initResolve: (() => void) | null = null
  private _subscribers: Set<(wallet: WalletData | null) => void> = new Set()
  private _lastUpdateTimestamp = 0
  private _pendingUpdates: Array<{ data: WalletData | null; timestamp: number }> = []
  private _processingUpdates = false
  private _mountCount = 0
  private _refreshCount = 0

  private constructor() {
    // Initialize the promise
    this._initPromise = new Promise<void>((resolve) => {
      this._initResolve = resolve
    })

    // Handle storage events
    if (typeof window !== "undefined") {
      window.addEventListener("storage", this._handleStorageEvent)
      window.addEventListener("walletUpdated", this._handleWalletUpdated)
    }
  }

  public static getInstance(): WalletStateContainer {
    if (!WalletStateContainer.instance) {
      WalletStateContainer.instance = new WalletStateContainer()
    }
    return WalletStateContainer.instance
  }

  // Track component mounting for Fast Refresh detection
  public componentMounted(): void {
    this._mountCount++
    debug(`WalletSync: Component mounted (total: ${this._mountCount})`)

    // If we have multiple mounts in quick succession, it might be a Fast Refresh
    const now = Date.now()
    if (this._lastUpdateTimestamp > 0 && now - this._lastUpdateTimestamp < 500) {
      this._refreshCount++
      debug(`WalletSync: Possible Fast Refresh detected (count: ${this._refreshCount})`)

      // Force reinitialization after Fast Refresh
      if (this._refreshCount > 1) {
        this._reinitializeAfterRefresh()
      }
    }

    this._lastUpdateTimestamp = now
  }

  // Reinitialize after Fast Refresh
  private _reinitializeAfterRefresh(): void {
    debug(`WalletSync: Reinitializing after Fast Refresh`)

    // Create a new initialization promise
    this._initPromise = new Promise<void>((resolve) => {
      this._initResolve = resolve
    })

    // Immediately resolve if we already have wallet data
    if (this._walletData) {
      if (this._initResolve) {
        this._initResolve()
      }
      this._isInitialized = true
    }
  }

  // Wait for initialization to complete with timeout
  public async waitForInit(timeoutMs = 2000): Promise<void> {
    if (this._isInitialized) {
      return Promise.resolve()
    }

    if (!this._initPromise) {
      this._initPromise = Promise.resolve()
      return this._initPromise
    }

    // Add timeout to prevent infinite waiting
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        debug(`WalletSync: Initialization timeout after ${timeoutMs}ms`)
        reject(new Error(`Wallet initialization timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([this._initPromise, timeoutPromise])
  }

  // Handle storage events
  private _handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === "walletData") {
      debug(`WalletSync: Storage event for walletData`)
      try {
        const data = event.newValue ? (JSON.parse(event.newValue) as WalletData) : null
        this._queueUpdate(data)
      } catch (error) {
        console.error("Error parsing wallet data from storage event:", error)
      }
    }
  }

  // Handle wallet updated events
  private _handleWalletUpdated = (): void => {
    debug(`WalletSync: walletUpdated event received`)
    // We'll refresh the data from storage in the next tick
    setTimeout(() => {
      try {
        const data = localStorage.getItem("walletData")
        if (data) {
          this._queueUpdate(JSON.parse(data))
        } else {
          this._queueUpdate(null)
        }
      } catch (error) {
        console.error("Error handling walletUpdated event:", error)
      }
    }, 0)
  }

  // Queue an update to prevent race conditions
  private _queueUpdate(data: WalletData | null): void {
    this._pendingUpdates.push({
      data,
      timestamp: Date.now(),
    })

    if (!this._processingUpdates) {
      this._processUpdates()
    }
  }

  // Process queued updates in order
  private async _processUpdates(): Promise<void> {
    if (this._pendingUpdates.length === 0) {
      this._processingUpdates = false
      return
    }

    this._processingUpdates = true

    // Sort updates by timestamp
    this._pendingUpdates.sort((a, b) => a.timestamp - b.timestamp)

    // Process each update
    while (this._pendingUpdates.length > 0) {
      const update = this._pendingUpdates.shift()
      if (update) {
        await this._applyUpdate(update.data)
      }
    }

    this._processingUpdates = false
  }

  // Apply a single update
  private async _applyUpdate(data: WalletData | null): Promise<void> {
    // Skip if data hasn't changed
    if (
      this._walletData === data ||
      (this._walletData && data && this._walletData.publicAddress === data.publicAddress)
    ) {
      return
    }

    this._walletData = data
    this._lastUpdateTimestamp = Date.now()

    // Mark as initialized if not already
    if (!this._isInitialized && this._initResolve) {
      this._isInitialized = true
      this._initResolve()
    }

    // Notify subscribers
    this._notifySubscribers()
  }

  // Notify all subscribers
  private _notifySubscribers(): void {
    debug(`WalletSync: Notifying ${this._subscribers.size} subscribers`)
    this._subscribers.forEach((callback) => {
      try {
        callback(this._walletData)
      } catch (error) {
        console.error("Error in wallet subscriber:", error)
      }
    })
  }

  // Set wallet data and notify subscribers
  public setWalletData(data: WalletData | null): void {
    this._queueUpdate(data)
  }

  // Get current wallet data with optional refresh
  public getWalletData(refresh = false): WalletData | null {
    if (refresh && typeof localStorage !== "undefined") {
      try {
        const data = localStorage.getItem("walletData")
        if (data) {
          const parsedData = JSON.parse(data) as WalletData
          if (parsedData && (!this._walletData || parsedData.publicAddress !== this._walletData.publicAddress)) {
            this._queueUpdate(parsedData)
          }
        }
      } catch (error) {
        console.error("Error refreshing wallet data:", error)
      }
    }
    return this._walletData
  }

  // Check if initialized
  public isInitialized(): boolean {
    return this._isInitialized
  }

  // Subscribe to wallet changes
  public subscribe(callback: (wallet: WalletData | null) => void): () => void {
    this._subscribers.add(callback)

    // Immediately call with current data if initialized
    if (this._isInitialized && this._walletData !== undefined) {
      try {
        callback(this._walletData)
      } catch (error) {
        console.error("Error in immediate wallet subscriber callback:", error)
      }
    }

    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback)
    }
  }

  // Clean up resources
  public cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this._handleStorageEvent)
      window.removeEventListener("walletUpdated", this._handleWalletUpdated)
    }
    this._subscribers.clear()
  }
}

// Export singleton instance
export const walletState = WalletStateContainer.getInstance()

// Helper function to initialize wallet state
export async function initializeWalletState(data: WalletData | null): Promise<void> {
  walletState.setWalletData(data)
}

// Helper to track component mounting for Fast Refresh detection
export function trackComponentMount(): void {
  walletState.componentMounted()
}