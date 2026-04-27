"use client"

import { useState } from "react"
import { createPunchCard } from "@/lib/services/punchcard-service"
import { getCurrentWallet } from "@/lib/services/wallet-service"
import type { Program } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gift, Loader2, AlertCircle } from "lucide-react"
import { TERMINOLOGY, PROGRAM_DEFAULTS } from "@/lib/constants"

interface NTangleDialogProps {
  program: Program | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (newCard: any) => void
  customerAddress: string
}

export function NTangleDialog({ program, isOpen, onClose, onSuccess, customerAddress }: NTangleDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!program || !customerAddress) {
      setError("Program or customer address is missing")
      return
    }
    
    // Get the customer's wallet ID
    const wallet = getCurrentWallet()
    if (!wallet?.walletID) {
      setError("Wallet ID not available. Please log in again.")
      return
    }
    
    setIsProcessing(true)
    setError(null)
    try {
      console.log("[v0] Starting punch card creation for program:", program.id)
      // createPunchCard is an alias for nTangle and requires customerWalletID
      const newCard = await createPunchCard(program, customerAddress, wallet.walletID)
      console.log("[v0] Punch card created successfully with txId:", newCard.txId)
      onSuccess(newCard)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create punch card"
      console.error("[v0] NTangleDialog Error:", errorMessage, err)
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!program) return null

  // Extract program-specific details from metadata
  const requiredPunches = program.metadata?.requiredPunches || 1
  const reward = program.metadata?.reward || "Reward"
  const satoshisPerPunch = program.metadata?.satoshisPerPunch
  
  if (!satoshisPerPunch) {
    return null // Program missing required data
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Earning Rewards</DialogTitle>
          <DialogDescription>
            You're about to become {TERMINOLOGY.NTANGLED} with {program.name}!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">{program.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                <span>
                  Collect {requiredPunches} {requiredPunches === 1 ? "punch" : "punches"} to earn: {reward}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Cost per punch: {satoshisPerPunch} satoshis
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            This will create your punch card NFT on the blockchain.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !!error}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Card...
              </>
            ) : (
              "Start Earning"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}