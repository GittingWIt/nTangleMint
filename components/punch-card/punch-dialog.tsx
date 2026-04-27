"use client"

import { useState } from "react"
import type { PunchCard } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Check } from "lucide-react"

interface PunchDialogProps {
  punchCard: PunchCard | null
  punchIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (punchCard: PunchCard, punchIndex: number) => Promise<void>
}

export function PunchDialog({ punchCard, punchIndex, open, onOpenChange, onConfirm }: PunchDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!punchCard) return
    
    setIsProcessing(true)
    try {
      await onConfirm(punchCard, punchIndex)
      onOpenChange(false)
    } catch (error) {
      console.error("[PunchDialog] Error adding punch:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!punchCard) return null

  const isLastPunch = punchCard.punches + 1 >= punchCard.requiredPunches

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLastPunch ? "Complete Your Card!" : "Add Punch"}
          </DialogTitle>
          <DialogDescription>
            {isLastPunch 
              ? "This is your final punch - you'll earn your reward!"
              : `Adding punch ${punchCard.punches + 1} of ${punchCard.requiredPunches}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">{punchCard.program.name}</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Progress</span>
              <span className="font-medium">
                {punchCard.punches} / {punchCard.requiredPunches}
              </span>
            </div>
            {isLastPunch && (
              <div className="mt-3 p-2 bg-primary/10 rounded text-center">
                <span className="text-sm font-medium text-primary">
                  Reward: {punchCard.reward}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            This transaction will be recorded on the blockchain (testnet).
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isLastPunch ? "Complete & Redeem" : "Add Punch"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}