import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Gift, Trophy, Sparkles } from "lucide-react"
import type { Program } from "@/lib/types"

interface RewardCelebrationProps {
  open: boolean
  program: Program | null
  onClose: () => void
  onRedeem: () => void
}

export function RewardCelebration({ open, program, onClose, onRedeem }: RewardCelebrationProps) {
  if (!program) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-amber-500 animate-bounce" />
              <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Congratulations!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              You've earned your reward!
            </p>
            <p className="text-sm text-muted-foreground">
              After completing all punches for {program.name}
            </p>
          </div>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  {program.rewardDescription}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your loyalty has paid off!
                </p>
              </div>
            </div>
          </Card>

          <div className="bg-muted/50 rounded-lg p-3 text-center text-sm text-muted-foreground">
            <p>Your reward has been recorded on the blockchain.</p>
            <p className="mt-1">Claim your reward from {program.name}.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Back
          </Button>
          <Button onClick={onRedeem} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
            Claim Reward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}