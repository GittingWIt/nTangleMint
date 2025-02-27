"use client"

import { DashboardContent } from "@/components/user/DashboardContent"
import type { Program } from "@/types"
import { PROGRAM_TYPES } from "@/lib/constants"

const mockPrograms: Program[] = [
  {
    id: "1",
    name: "Coffee Lovers Program",
    businessName: "Local Coffee Shop",
    type: PROGRAM_TYPES.PUNCH_CARD,
    category: "food-beverage",
    description: "Earn points with every coffee purchase",
    rewards: [
      {
        description: "Free coffee after 10 punches",
        threshold: 10,
      },
    ],
    participants: [],
    rewards_claimed: 0,
    merchant_address: "merchant123",
    nftDesign: {
      image: "coffee-bg",
      color: "#8B4513",
    },
    isOpenEnded: true, // Added the required property
  },
]

export default function UserDashboardPage() {
  return (
    <DashboardContent
      programs={mockPrograms}
      isLoading={false}
      error="" // Changed from undefined to empty string
    />
  )
}