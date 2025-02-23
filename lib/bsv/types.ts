// Wallet Types
export interface Transaction {
  id: string
  amount: number
  timestamp: Date
  type: 'send' | 'receive'
  address: string
  status: 'pending' | 'completed' | 'failed'
}

export interface WalletData {
  publicAddress: string
  type: 'user' | 'merchant'
  mnemonic: string
  createdAt: string
  transactions?: Transaction[]
}

export interface MerchantSettings {
  emailNotifications: boolean
  notificationEmail: string
  webhookUrl: string
  apiKey: string
}

// Program Types
export interface Program {
  id: string
  name: string
  description: string
  merchantId: string
  businessName: string
  type: 'punch-card' | 'points' | 'tiered'
  pointsPerReward: number
  rewardDescription: string
  participants?: string[]
  transactions?: number
  rewards_claimed?: number
  created_at: string
  nftDesign?: NFTDesign
}

export interface UserParticipation {
  programId: string
  points: number
  rewards_claimed: number
  lastEarned: string
  nfts: string[]
}

// NFT Types
export interface NFTDesign {
  layers: Array<{
    type: string
    content: string
    opacity?: number
    blendMode?: string
  }>
  aspectRatio: string
  borderRadius: string
  animation?: {
    type: string
    duration: number
  }
}

// BSV Network Types
export interface BSVNetwork {
  name: string
  alias: string
  pubkeyhash: number
  privatekey: number
  scripthash: number
  xpubkey: number
  xprivkey: number
  networkMagic: number
}

export interface TokenMintParams {
  address: string
  privateKey: string
  symbol: string
  amount: number
}

export interface TransactionConfig {
  fee?: number
  data?: string[]
}