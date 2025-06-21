import type React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface MerchantProgramCardProps {
  programName: string
  description: string
  imageUrl: string
}

const MerchantProgramCard: React.FC<MerchantProgramCardProps> = ({ programName, description, imageUrl }) => {
  const { wallet } = useWalletContext()

  // Directly access merchant profile data from the wallet context
  const merchantProfile = wallet?.merchantProfile

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{programName}</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <img src={imageUrl || "/placeholder.svg"} alt={programName} className="h-16 w-16 rounded-full" />
          <div>
            <p className="text-sm text-gray-500">{description}</p>
            {merchantProfile && (
              <>
                <p className="text-sm">Merchant Name: {merchantProfile.merchantName}</p>
                <p className="text-sm">Merchant ID: {merchantProfile.merchantId}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MerchantProgramCard