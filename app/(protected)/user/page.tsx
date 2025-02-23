import { DashboardContent } from "@/components/user/DashboardContent"

// Mock data for development - replace with actual data fetching
const mockPrograms = [
  {
    id: "1",
    name: "Coffee Shop Rewards",
    description: "Earn points with every purchase",
    merchant_address: "merchant1",
    participants: [
      {
        address: "user1",
        points: 100,
        available_rewards: 2,
      },
    ],
    rewards_claimed: 5,
  },
]

export default function UserDashboardPage() {
  return <DashboardContent programs={mockPrograms} />
}