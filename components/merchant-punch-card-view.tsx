import { formatDisplayDate } from "@/lib/utils/date-utils"
import { Users, Coffee, Calendar, Award, Settings } from "lucide-react"

interface MerchantPunchCardViewProps {
  programId: string
  programName: string
  description: string
  requiredPunches: number
  participantCount: number
  expirationDate: string
  reward: string
  isActive: boolean
}

export function MerchantPunchCardView({
  programId,
  programName,
  description,
  requiredPunches = 5,
  participantCount = 0,
  expirationDate = "2025-12-31",
  reward = "Free coffee",
  isActive = true,
}: MerchantPunchCardViewProps) {
  // Format the expiration date
  const formattedDate = formatDisplayDate(expirationDate)

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{programName}</h3>
          <div
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      {/* Program Details */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start">
            <Coffee className="text-blue-600 mr-2 mt-0.5" size={18} />
            <div>
              <div className="text-sm font-medium text-gray-900">Punch Requirement</div>
              <div className="text-sm text-gray-600">{requiredPunches} punches needed</div>
            </div>
          </div>

          <div className="flex items-start">
            <Award className="text-blue-600 mr-2 mt-0.5" size={18} />
            <div>
              <div className="text-sm font-medium text-gray-900">Reward</div>
              <div className="text-sm text-gray-600">{reward}</div>
            </div>
          </div>

          <div className="flex items-start">
            <Users className="text-blue-600 mr-2 mt-0.5" size={18} />
            <div>
              <div className="text-sm font-medium text-gray-900">Participants</div>
              <div className="text-sm text-gray-600">{participantCount} enrolled</div>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="text-blue-600 mr-2 mt-0.5" size={18} />
            <div>
              <div className="text-sm font-medium text-gray-900">Expiration</div>
              <div className="text-sm text-gray-600">{formattedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-4 border-t bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Total Punches Given</div>
            <div className="text-xl font-bold text-blue-700">
              {participantCount > 0 ? Math.floor(Math.random() * 10 * participantCount) : 0}
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Rewards Claimed</div>
            <div className="text-xl font-bold text-green-700">
              {participantCount > 0 ? Math.floor(Math.random() * participantCount) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">Program ID: {programId.substring(0, 8)}...</div>
        <div className="flex items-center">
          <button className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <Settings size={16} className="mr-1" />
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}