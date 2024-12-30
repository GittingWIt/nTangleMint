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
  business: string
  type: 'punch-card' | 'tiered' | 'points' | 'coalition'
  category: string
  description: string
  participants: number
  image: string
  completionRate?: number
  baseParticipants?: number
  baseRewards?: number
  growthRate?: number
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