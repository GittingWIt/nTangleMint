import type { PROGRAM_TYPES } from "@/lib/constants"

// Update the type to use the values from PROGRAM_TYPES
export type ProgramType = (typeof PROGRAM_TYPES)[keyof typeof PROGRAM_TYPES]

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
  type: ProgramType
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
  isOpenEnded: boolean // Added this property
}

export interface UserParticipation {
  programId: string
  points: number
  punchCount: number
  tier: number
  joinedAt: string
}