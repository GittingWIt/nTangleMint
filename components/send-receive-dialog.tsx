'use client';

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Copy, Check, AlertCircle, Loader2 } from "lucide-react"
import type { Wallet } from "@/lib/types"
import { sendBsv, validateBsvAddress } from "@/lib/services/send-receive-service"
import { formatBsv, satoshisToUsd } from "@/lib/utils/conversion"

interface SendReceiveDialogProps {
  wallet: Wallet
  isOpen: boolean
  onClose: () => void
  mode: "send" | "receive"
  onSendSuccess?: (txId: string) => void
}

export function SendReceiveDialog({ wallet, isOpen, onClose, mode, onSendSuccess }: SendReceiveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {mode === "send" ? "Send BSV" : "Receive BSV"}
          </DialogTitle>
          <DialogDescription>
            {mode === "send" ? "Transfer BSV to another wallet address" : "Share your address to receive BSV"}
          </DialogDescription>
        </DialogHeader>

        {mode === "send" ? (
          <SendBsvForm wallet={wallet} onSuccess={onSendSuccess} />
        ) : (
          <ReceiveBsvCard wallet={wallet} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SendBsvForm({ wallet, onSuccess }: { wallet: Wallet; onSuccess?: (txId: string) => void }) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amountSats, setAmountSats] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSend = async () => {
    setError("")
    setSuccess("")

    // Validate inputs
    if (!recipientAddress.trim()) {
      setError("Please enter a recipient address")
      return
    }

    if (!amountSats || Number(amountSats) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    // Validate address format
    const isValid = await validateBsvAddress(recipientAddress)
    if (!isValid) {
      setError("Invalid BSV address format")
      return
    }

    if (recipientAddress === wallet.publicAddress) {
      setError("Cannot send to your own address")
      return
    }

    setIsLoading(true)

    try {
      const result = await sendBsv({
        senderAddress: wallet.publicAddress,
        recipientAddress,
        amountInSatoshis: Number(amountSats),
      })

      if (result.success && result.txId) {
        setSuccess(`Transaction sent! TxID: ${result.txId.slice(0, 16)}...`)
        setRecipientAddress("")
        setAmountSats("")
        onSuccess?.(result.txId)
      } else {
        setError(result.error || "Failed to send transaction")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const usdValue = satoshisToUsd(Number(amountSats) || 0)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Recipient Address</label>
        <Input
          placeholder="Enter BSV address (e.g., 1A1z...)"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Amount (Satoshis)</label>
        <Input
          type="number"
          placeholder="0"
          value={amountSats}
          onChange={(e) => setAmountSats(e.target.value)}
          disabled={isLoading}
          min="1"
        />
        {amountSats && (
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {formatBsv(Number(amountSats), 8)} BSV ≈ ${usdValue.toFixed(2)} USD
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleSend} disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "Sending..." : "Send BSV"}
      </Button>
    </div>
  )
}

function ReceiveBsvCard({ wallet }: { wallet: Wallet }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.publicAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-muted/50 border-0">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-2">Your Address</p>
          <div className="font-mono text-sm break-all bg-background p-3 rounded-lg border mb-3">
            {wallet.publicAddress}
          </div>
          <Button onClick={handleCopy} variant="outline" className="w-full bg-transparent" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Address"}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Share this address with anyone who wants to send you BSV. This address is safe to share publicly.
        </AlertDescription>
      </Alert>
    </div>
  )
}