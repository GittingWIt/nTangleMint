"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Wallet, Store, Copy, Check, AlertTriangle } from "lucide-react"
import { generateWallet } from "@/lib/bsv/wallet"
import { setWalletData, getWalletData, clearWalletData } from "@/lib/storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import dynamic from "next/dynamic"

const CreateWalletForm = dynamic(() => Promise.resolve(CreateWalletFormComponent), { ssr: false })

export default CreateWalletForm

function CreateWalletFormComponent() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [walletType, setWalletType] = useState<"user" | "merchant">("user")
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [generatedMnemonic, setGeneratedMnemonic] = useState("")
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [generatedWallet, setGeneratedWallet] = useState<any>(null)

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

      console.log("[Wallet Generation] Creating new wallet of type:", walletType)

      // Clear any existing wallet data
      await clearWalletData()

      const wallet = await generateWallet(password, walletType)
      console.log("[Wallet Generation] Generated wallet with type:", wallet.type)

      setGeneratedWallet(wallet)
      setGeneratedMnemonic(wallet.mnemonic)
      setShowSeedPhrase(true)
      setCopied(false)
      setConfirmed(false)
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

      await setWalletData(generatedWallet)
      console.log("[Wallet Generation] Wallet data stored after confirmation")

      const storedData = await getWalletData()
      if (!storedData || storedData.type !== walletType) {
        throw new Error("Wallet storage verification failed")
      }

      setShowSeedPhrase(false)
      window.location.href = `/${walletType}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to proceed")
      console.error("[Wallet Generation] Error during confirmation:", err)
    }
  }

  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="mb-6">
          <Label>Select Wallet Type</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                walletType === "user"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => setWalletType("user")}
            >
              <Wallet className="w-8 h-8 mb-2" />
              <span className="font-medium">User Wallet</span>
              <span className="text-xs text-muted-foreground mt-1">For individual users</span>
            </div>
            <div
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                walletType === "merchant"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => setWalletType("merchant")}
            >
              <Store className="w-8 h-8 mb-2" />
              <span className="font-medium">Merchant Wallet</span>
              <span className="text-xs text-muted-foreground mt-1">For businesses</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
          <Button className="w-full" disabled={isGenerating} onClick={handleCreateWallet}>
            {isGenerating ? "Creating..." : "Create Wallet"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog open={showSeedPhrase} onOpenChange={setShowSeedPhrase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Recovery Phrase</DialogTitle>
            <DialogDescription>
              <div className="mb-4">
                <Alert variant="warning">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Write down these 12 words in order and keep them in a secure location. You will need them to recover
                    your wallet. Never share your recovery phrase with anyone.
                  </AlertDescription>
                </Alert>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative p-4 bg-muted rounded-lg font-mono text-sm">
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
                I have securely saved my recovery phrase
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" disabled={!confirmed} onClick={handleConfirmAndProceed} className="w-full">
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { CreateWalletFormComponent }