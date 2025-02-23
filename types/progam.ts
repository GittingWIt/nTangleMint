export type ProgramType = "punch-card" | "tiered" | "points" | "cashback" | "subscription"
export type ProgramCategory = "food-beverage" | "retail" | "health-fitness" | "multi-merchant"

export interface NFTDesign {
  layers: {
    type: string
    content: string
    opacity?: number
    blendMode?: string
  }[]
  aspectRatio: string
  borderRadius: string
  animation?: {
    type: string
    duration: number
  }
}

export interface Program {
  id: string
  name: string
  business: string
  type: ProgramType
  category: ProgramCategory
  description: string
  rewardStructure?: string
  isOpenEnded: boolean
  participants: string[]
  rewards_claimed: number
  created_at: string
  merchantId: string
  nftDesign: NFTDesign
}