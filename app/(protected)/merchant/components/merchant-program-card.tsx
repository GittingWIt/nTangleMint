"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Coffee, Tag, Users, Calendar, Settings, TrendingUp, Gift, ExternalLink } from "lucide-react"
import Link from "next/link"

interface MerchantProgram {
  id: string
  name: string
  description: string
  type: "punch-card" | "coupon-book"
  merchantAddress: string
  participants: string[]
  status: "active" | "draft" | "paused"
  metadata?: {
    requiredPunches?: number
    totalCoupons?: number
    reward?: string
    discountAmount?: string
    merchantName?: string
    products?: Array<{ name: string }>
  }
  stats?: {
    totalParticipants: number
    rewardsRedeemed: number
    engagementRate: number
  }
  createdAt?: string
}

interface MerchantProgramCardProps {
  program: MerchantProgram
  showActions?: boolean
  compact?: boolean
}

export function MerchantProgramCard({ program, showActions = true, compact = false }: MerchantProgramCardProps) {
  const completionRate = program.stats
    ? Math.round((program.stats.rewardsRedeemed / Math.max(program.stats.totalParticipants, 1)) * 100)
    : 0

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden hover:shadow-xl transition-shadow">
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                program.type === "punch-card" ? "bg-amber-100" : "bg-green-100"
              }`}
            >
              {program.type === "punch-card" ? (
                <Coffee className="h-6 w-6 text-amber-600" />
              ) : (
                <Tag className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className={`text-slate-900 ${compact ? "text-lg" : "text-xl"}`}>{program.name}</CardTitle>
              <CardDescription className="text-slate-600 line-clamp-2">{program.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={program.status === "active" ? "default" : "secondary"}
            className={program.status === "active" ? "bg-green-100 text-green-800" : ""}
          >
            {program.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4" />
            <span>{program.participants.length} participants</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(program.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          {program.stats && (
            <>
              <div className="flex items-center gap-2 text-slate-600">
                <Gift className="h-4 w-4" />
                <span>{program.stats.rewardsRedeemed} redeemed</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <TrendingUp className="h-4 w-4" />
                <span>{program.stats.engagementRate}% engaged</span>
              </div>
            </>
          )}
        </div>

        {/* Program Details */}
        {!compact && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {program.type === "punch-card" ? "Required Punches" : "Total Coupons"}
              </span>
              <span className="font-medium text-slate-900">
                {program.type === "punch-card"
                  ? program.metadata?.requiredPunches || "N/A"
                  : program.metadata?.totalCoupons || "N/A"}
              </span>
            </div>
            {program.metadata?.reward && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Reward</span>
                <span className="font-medium text-slate-900 text-right max-w-32 truncate">
                  {program.metadata.reward}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Engagement Progress */}
        {program.stats && !compact && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Completion Rate</span>
              <span className="font-medium text-slate-900">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}

        {/* Products */}
        {program.metadata?.products && program.metadata.products.length > 0 && !compact && (
          <div>
            <span className="text-slate-600 text-xs">Applicable to:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {program.metadata.products.slice(0, 3).map((product, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {product.name}
                </Badge>
              ))}
              {program.metadata.products.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{program.metadata.products.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/merchant/programs/${program.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}