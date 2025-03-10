"use client"

import { DashboardContent } from "@/components/user/DashboardContent"
import type { Program, ProgramType, ProgramStatus } from "@/types"

const mockPrograms: Program[] = [
  {
    id: "1",
    name: "Coffee Lovers Program",
    type: "punch-card" as ProgramType, // Use the correct ProgramType value
    description: "Earn points with every coffee purchase",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    merchantAddress: "merchant123", // Changed from merchant_address
    status: "active" as ProgramStatus, // Use the correct ProgramStatus value
    metadata: {
      // Add required metadata
      discountAmount: "10%",
      upcCodes: ["123456789"],
      requiredPunches: 10,
      reward: "Free coffee after 10 punches",
    },
    version: 1,
    isPublic: true,
    participants: [], // Add the required participants array
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