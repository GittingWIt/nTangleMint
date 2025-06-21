"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Wallet, Store, Copy, Check, AlertTriangle, Coins } from "lucide-react"
import { generateWallet } from "@/lib/bsv/wallet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"

const CreateWalletForm = dynamic(() => Promise.resolve(CreateWalletFormComponent), { ssr: false })

export default CreateWalletForm

function CreateWalletFormComponent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletType, setWalletType] = useState<"customer" | "merchant">("customer")
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [generatedMnemonic, setGeneratedMnemonic] = useState("")
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [generatedWallet, setGeneratedWallet] = useState<any>(null)
  const [bsvTransactionId, setBsvTransactionId] = useState("")

  // Clear any existing wallet data on mount
  useEffect(() => {
    const cleanup = async () => {
      try {
        console.log("CreateWalletForm: Cleaning up any existing wallet data")
        // Clear any existing data without using storage-compat
        if (typeof window !== "undefined") {
          localStorage.removeItem("walletData")
        }
      } catch (err) {
        console.error("Error clearing wallet data:", err)
      }
    }

    cleanup()
  }, [])

  const handleCreateWallet = async () => {
    setIsGenerating(true)
    setError("")

    try {
      if (!password) {
        throw new Error("Please enter a password")
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      console.log(`[Wallet Generation] Creating new ${walletType} wallet with BSV metadata transaction`)

      // Generate wallet with BSV blockchain integration
      const wallet = await generateWallet(password, walletType, {
        businessName: walletType === "merchant" ? businessName : undefined,
        sendMetadataTransaction: true, // Send metadata to BSV blockchain
        includeTimestamp: true,
        includeWalletType: true,
      })

      console.log("[Wallet Generation] Generated wallet with type:", wallet.type)

      // Check if mnemonic exists
      if (!wallet.mnemonic) {
        throw new Error("Failed to generate wallet recovery phrase")
      }

      setGeneratedWallet(wallet)
      setGeneratedMnemonic(wallet.mnemonic)
      setBsvTransactionId(wallet.metadataTransactionId || "")
      setShowSeedPhrase(true)
      setCopied(false)
      setConfirmed(false)

      console.log(
        `[Wallet Generation] ✅ ${walletType} wallet created with BSV metadata transaction:`,
        wallet.metadataTransactionId,
      )
    } catch (err) {
      console.error("[Wallet Generation] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate wallet recovery phrase")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyMnemonic = async () => {
    try {
      await navigator.clipboard.writeText(generatedMnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }
  }

  const handleConfirmAndProceed = async () => {
    try {
      if (!confirmed) {
        throw new Error("Please confirm that you have saved your recovery phrase")
      }

      if (!generatedWallet) {
        throw new Error("No wallet data found")
      }

      // Save wallet data to localStorage (temporary until full blockchain integration)
      localStorage.setItem("walletData", JSON.stringify(generatedWallet))
      console.log("[Wallet Generation] Wallet data stored after confirmation")

      setShowSeedPhrase(false)
      window.location.href = walletType === "customer" ? "/user" : "/merchant"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to proceed")
      console.error("[Wallet Generation] Error during confirmation:", err)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Wallet Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Select Wallet Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all ${
                walletType === "customer"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
              onClick={() => setWalletType("customer")}
            >
              <Wallet className="w-12 h-12 mb-3" />
              <span className="font-semibold text-lg mb-1">Customer Wallet</span>
              <span className="text-sm text-center opacity-75">For individual users</span>
              <div className="mt-3 space-y-1 text-xs text-center">
                <div>• Earn rewards & loyalty points</div>
                <div>• Participate in programs</div>
                <div>• Redeem benefits</div>
              </div>
            </div>
            <div
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all ${
                walletType === "merchant"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
              }`}
              onClick={() => setWalletType("merchant")}
            >
              <Store className="w-12 h-12 mb-3" />
              <span className="font-semibold text-lg mb-1">Merchant Wallet</span>
              <span className="text-sm text-center opacity-75">For businesses</span>
              <div className="mt-3 space-y-1 text-xs text-center">
                <div>• Create loyalty programs</div>
                <div>• Manage customers</div>
                <div>• Analytics & insights</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Name for Merchant */}
        {walletType === "merchant" && (
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-base font-medium">
              Business Name
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              className="text-base h-12"
            />
            <p className="text-sm text-slate-500">
              This will be stored on the BSV blockchain with your wallet metadata
            </p>
          </div>
        )}

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-medium">
              Wallet Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password (8+ characters)"
              className="text-base h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="text-base h-12"
            />
          </div>
        </div>

        {/* BSV Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">BSV Blockchain Integration</span>
          </div>
          <p className="text-sm text-blue-700">
            Your wallet metadata will be securely stored on the Bitcoin SV blockchain, enabling restoration from any
            device using your recovery phrase.
          </p>
        </div>

        <Button
          onClick={handleCreateWallet}
          disabled={isGenerating || !password || password !== confirmPassword || password.length < 8}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Coins className="w-5 h-5 mr-2 animate-spin" />
              Creating Wallet & BSV Transaction...
            </>
          ) : (
            `Create ${walletType === "customer" ? "Customer" : "Merchant"} Wallet`
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Enhanced Seed Phrase Dialog */}
      <Dialog open={showSeedPhrase} onOpenChange={setShowSeedPhrase}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-600" />
              Wallet Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your wallet has been created and metadata sent to the BSV blockchain. Save this recovery phrase to restore
              your wallet later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bsvTransactionId && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    BSV Transaction
                  </Badge>
                </div>
                <p className="text-xs font-mono text-green-700 break-all">{bsvTransactionId}</p>
              </div>
            )}

            <div className="relative p-4 bg-slate-100 rounded-lg font-mono text-sm">
              <div className="pr-10 whitespace-pre-wrap break-words">{generatedMnemonic}</div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleCopyMnemonic}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy recovery phrase</span>
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Write down these 12 words in order and keep them in a secure location. You will need them to recover
                your wallet. Never share your recovery phrase with anyone.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <Label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have securely saved my recovery phrase and understand it cannot be recovered if lost
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" disabled={!confirmed} onClick={handleConfirmAndProceed} className="w-full">
              Continue to Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { CreateWalletFormComponent }