export interface Transaction {
  id: string
  amount: number
  timestamp: Date
  type: 'send' | 'receive'
  address: string
  status: 'pending' | 'completed' | 'failed'
}

export interface Program {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  created: Date
}

export interface WalletData {
  publicAddress: string
  type: 'user' | 'merchant'
  transactions?: Transaction[]
  programs?: Program[]
}

export interface WalletState {
  isInitialized: boolean
  data: WalletData | null
}