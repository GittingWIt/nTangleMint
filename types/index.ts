import type { PROGRAM_TYPES } from "@/lib/constants"

export interface WalletData {
  type: "user" | "merchant"
  publicAddress: string
  businessName?: string
  path?: string
  mnemonic: string
  privateKey: string
  publicKey: string
}

export interface Program {
  id: string
  name: string
  businessName: string
  description: string
  type: keyof typeof PROGRAM_TYPES
  category: string
  participants: string[]
  rewards: {
    description: string
    threshold: number
  }[]
  nftDesign?: {
    image?: string
    color?: string
  }
  rewards_claimed: number
  merchant_address: string
}

export interface UserParticipation {
  programId: string
  points: number
  punchCount: number
  tier: number
  joinedAt: string
}