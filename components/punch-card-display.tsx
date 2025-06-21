import { formatDisplayDate } from "@/lib/utils/date-utils"

interface PunchCardDisplayProps {
  requiredPunches: number
  currentPunches?: number
  punches?: number // For backward compatibility
  reward?: string
  expirationDate?: string | Date
}

export function PunchCardDisplay({
  requiredPunches = 5,
  currentPunches,
  punches, // For backward compatibility
  reward = "Free coffee",
  expirationDate,
}: PunchCardDisplayProps) {
  // Use currentPunches if provided, otherwise fall back to punches for backward compatibility
  const actualPunches = currentPunches !== undefined ? currentPunches : punches || 0

  // Create an array of punch circles
  const punchesArray = Array.from({ length: requiredPunches }, (_, i) => i < actualPunches)

  return (
    <div className="bg-amber-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-amber-900">Punch Progress</h4>
        <span className="text-xs text-amber-700">
          {actualPunches} of {requiredPunches} collected
        </span>
      </div>

      <div className="flex justify-between mb-3">
        {punchesArray.map((isPunched, index) => (
          <div
            key={index}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              isPunched ? "bg-amber-500 border-amber-600 text-white" : "bg-white border-amber-300 text-amber-500"
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-amber-800 text-xs">
        <div className="flex items-center">
          <span className="mr-1">🏆</span>
          <span>
            {reward} after {requiredPunches} punches
          </span>
        </div>

        {expirationDate && (
          <div className="flex items-center">
            <span className="mr-1">📅</span>
            <span>
              Expires:{" "}
              {formatDisplayDate(typeof expirationDate === "object" ? expirationDate.toISOString() : expirationDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default PunchCardDisplay