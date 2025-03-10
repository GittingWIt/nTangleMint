export interface WalletStatus {
    isActive: boolean
    isConnected: boolean
    lastSyncTime: string
    storageState: "persistent" | "temporary" | "none"
    sessionValid: boolean
    localStorageValid: boolean
  }
  
  export interface WalletValidation {
    hasRequiredFields: boolean
    addressValid: boolean
    keysValid: boolean
    signatureValid: boolean
    businessInfoValid: boolean
  }
  
  export interface WalletBalance {
    available: number
    pending: number
    reserved: number
    lastUpdated: string
  }
  
  export interface Transaction {
    id: string
    type: string
    amount: number
    status: "pending" | "confirmed" | "failed"
    timestamp: string
  }
  
  export interface WalletTransactions {
    recent: Transaction[]
    pendingCount: number
    failedCount: number
  }
  
  export interface WalletPermissions {
    canCreatePrograms: boolean
    canIssueRewards: boolean
    canModifySettings: boolean
  }
  
  export interface WalletErrors {
    recent: string[]
    count: number
    lastError: string | null
  }
  
  export interface NetworkInfo {
    connected: boolean
    latency: number
    nodeVersion: string
    peerCount: number
  }
  
  export interface StorageInfo {
    walletDataSize: number
    lastBackupTime: string
    encryptionStatus: "enabled" | "disabled"
  }
  
  export interface WalletMetadata {
    businessId: string
    businessName: string
    createdAt: string
    updatedAt: string
    walletVersion: string
    deviceId: string
  }
  
  export interface ProgramCreation {
    success: boolean
    duration: number
    walletVerified: boolean
    formValidated: boolean
    storageConfirmed: boolean
  }
  
  export interface ProgramValidation {
    fieldsValid: boolean
    upcCodesValid: boolean
    expirationValid: boolean
    merchantSignatureValid: boolean
  }
  
  export interface BrowserInfo {
    userAgent: string
    localStorage: "available" | "unavailable"
    sessionStorage: "available" | "unavailable"
    cookiesEnabled: boolean
  }
  
  export interface StorageStats {
    walletDataSize: number
    programsDataSize: number
    availableSpace: number
  }
  
  export interface PerformanceMetrics {
    walletLoadTime: number
    programCreationTime: number
    domUpdates: number
  }
  
  export interface TestSuiteInfo {
    version: string
    testsRun: number
    testsPassed: number
    testsFailed: number
    coverage: number
  }
  
  export interface WalletTestResults {
    success: boolean
    timestamp: string
    wallet: {
      type: string
      address: string
      status: WalletStatus
      validation: WalletValidation
      balance: WalletBalance
      transactions: WalletTransactions
      permissions: WalletPermissions
      errors: WalletErrors
      network: NetworkInfo
      storage: StorageInfo
      metadata: WalletMetadata
    }
    program: {
      id: string
      type: string
      status: string
      creation: ProgramCreation
      validation: ProgramValidation
    }
    diagnostics: {
      browserInfo: BrowserInfo
      testMode: boolean
      mockWalletUsed: boolean
      storageStats: StorageStats
      performance: PerformanceMetrics
      errors: {
        count: number
        details: string[]
      }
    }
    testSuite: TestSuiteInfo
  }
  