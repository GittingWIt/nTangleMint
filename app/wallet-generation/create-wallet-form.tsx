"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Eye, EyeOff, CheckCircle, AlertTriangle, Wallet, User, Store } from "lucide-react"

interface WalletFormData {
  type: "customer" | "merchant" | ""
  password: string
  confirmPassword: string
}

export default function CreateWalletForm() {
  const [formData, setFormData] = useState<WalletFormData>({
    type: "",
    password: "",
    confirmPassword: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createdWallet, setCreatedWallet] = useState<any>(null)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mnemonicCopied, setMnemonicCopied] = useState(false)
  const [error, setError] = useState("")
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false)

  const generateMnemonic = () => {
    // TODO: Replace with actual BSV mnemonic generation
    const words = [
      "abandon",
      "ability",
      "able",
      "about",
      "above",
      "absent",
      "absorb",
      "abstract",
      "absurd",
      "abuse",
      "access",
      "accident",
      "account",
      "accuse",
      "achieve",
      "acid",
      "acoustic",
      "acquire",
      "across",
      "act",
      "action",
      "actor",
      "actress",
      "actual",
      "adapt",
      "add",
      "addict",
      "address",
      "adjust",
      "admit",
      "adult",
      "advance",
      "advice",
      "aerobic",
      "affair",
      "afford",
      "afraid",
      "again",
      "against",
      "age",
    ]
    return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(" ")
  }

  const generateAddress = () => {
    // TODO: Replace with actual BSV address generation
    return "1" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleCreateWallet = async () => {
    // Validation
    if (!formData.type) {
      setError("Please select a wallet type")
      return
    }

    if (!formData.password) {
      setError("Password is required")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      // TODO: Replace with actual BSV wallet creation using password
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mnemonic = generateMnemonic()
      const publicAddress = generateAddress()

      const walletData = {
        id: Date.now().toString(),
        type: formData.type,
        publicAddress,
        mnemonic,
        createdAt: new Date().toISOString(),
        // TODO: Add actual BSV wallet properties
        privateKey: "TODO_PRIVATE_KEY",
        encryptedPrivateKey: "TODO_ENCRYPTED_WITH_PASSWORD",
        balance: 0,
        metadataTransactionId: `created_${Date.now()}`,
      }

      // Store in wallets array for restoration - FIXED: Properly handle array
      let storedWallets = []
      try {
        const existingWallets = localStorage.getItem("stored-wallets")
        if (existingWallets) {
          const parsed = JSON.parse(existingWallets)
          storedWallets = Array.isArray(parsed) ? parsed : []
        }
      } catch (e) {
        console.warn("Failed to parse stored wallets, starting fresh:", e)
        storedWallets = []
      }

      storedWallets.push(walletData)
      localStorage.setItem("stored-wallets", JSON.stringify(storedWallets))

      setCreatedWallet(walletData)
    } catch (error) {
      console.error("Error creating wallet:", error)
      setError("Failed to create wallet. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const copyMnemonic = async () => {
    if (createdWallet?.mnemonic) {
      await navigator.clipboard.writeText(createdWallet.mnemonic)
      setMnemonicCopied(true)
      setTimeout(() => setMnemonicCopied(false), 2000)
    }
  }

  const handleContinue = () => {
    // Only create session when user confirms they've backed up
    localStorage.setItem(
      "bsv-wallet-session",
      JSON.stringify({
        address: createdWallet.publicAddress,
        type: createdWallet.type,
        timestamp: Date.now(),
      }),
    )

    localStorage.setItem(
      "devWalletData",
      JSON.stringify({
        publicAddress: createdWallet.publicAddress,
        type: createdWallet.type,
      }),
    )

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent("bsvWalletUpdated", { detail: createdWallet }))

    if (createdWallet.type === "merchant") {
      window.location.href = "/merchant"
    } else {
      window.location.href = "/customer"
    }
  }

  if (createdWallet) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Wallet Created Successfully!</CardTitle>
          <CardDescription>Your BSV wallet has been created and secured with your password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {createdWallet.type === "merchant" ? (
                  <Store className="h-5 w-5 text-blue-600" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold capitalize">{createdWallet.type} Wallet</h3>
                <p className="text-sm text-slate-600">Ready to use</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600">Address:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded text-xs">{createdWallet.publicAddress}</code>
              </div>
            </div>
          </div>

          {/* Recovery Phrase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recovery Phrase</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMnemonic(!showMnemonic)}>
                  {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={copyMnemonic} disabled={!showMnemonic}>
                  {mnemonicCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Write down your recovery phrase and store it securely. This is the only way
                to restore your wallet if you lose access.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-900 text-white p-4 rounded-lg">
              {showMnemonic ? (
                <div className="grid grid-cols-3 gap-2">
                  {createdWallet.mnemonic.split(" ").map((word: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm w-6">{index + 1}.</span>
                      <span className="font-mono">{word}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">Click the eye icon to reveal your recovery phrase</div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm-backup"
                checked={hasConfirmedBackup}
                onChange={(e) => setHasConfirmedBackup(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="confirm-backup" className="text-sm">
                I have written down my 12-word recovery phrase and stored it in a safe place
              </Label>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You must confirm that you have backed up your recovery phrase before continuing.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleContinue} disabled={!hasConfirmedBackup} className="flex-1">
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Create BSV Wallet</CardTitle>
        <CardDescription>Create a new BSV wallet secured with a password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Type Selection - Card Style */}
        <div className="space-y-3">
          <Label>Choose Your Wallet Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.type === "customer" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
              }`}
              onClick={() => setFormData({ ...formData, type: "customer" })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Customer</h3>
                    <p className="text-sm text-slate-600">Join loyalty programs and earn rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.type === "merchant" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
              }`}
              onClick={() => setFormData({ ...formData, type: "merchant" })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Merchant</h3>
                    <p className="text-sm text-slate-600">Create and manage loyalty programs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Password Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter a secure password (min 8 characters)"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your password encrypts your wallet locally. Make sure to remember it - it cannot be recovered.
          </AlertDescription>
        </Alert>

        <Button onClick={handleCreateWallet} disabled={isCreating || !formData.type} className="w-full">
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Wallet...
            </>
          ) : (
            "Create Wallet"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}