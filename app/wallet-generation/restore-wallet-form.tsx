"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { KeyRound, CheckCircle, AlertTriangle, User, Store, Trash2, Eye, EyeOff } from "lucide-react"

export default function RestoreWalletForm() {
  const [mnemonic, setMnemonic] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoredWallet, setRestoredWallet] = useState<any>(null)
  const [error, setError] = useState("")
  const [storedWallets, setStoredWallets] = useState<any[]>([])

  // Load stored wallets on component mount
  useState(() => {
    try {
      const wallets = JSON.parse(localStorage.getItem("stored-wallets") || "[]")
      setStoredWallets(wallets)
    } catch (error) {
      console.error("Error loading stored wallets:", error)
    }
  })

  const validateMnemonic = (phrase: string) => {
    // TODO: Replace with actual BSV mnemonic validation
    const words = phrase.trim().split(/\s+/)
    return words.length >= 12 && words.length <= 24
  }

  const handleRestoreWallet = async () => {
    if (!mnemonic.trim()) {
      setError("Please enter your recovery phrase")
      return
    }

    if (!password.trim()) {
      setError("Please enter your wallet password")
      return
    }

    if (!validateMnemonic(mnemonic)) {
      setError("Invalid recovery phrase. Please enter 12-24 words.")
      return
    }

    setIsRestoring(true)
    setError("")

    try {
      // TODO: Replace with actual BSV wallet restoration using mnemonic + password
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // For demo, try to find matching wallet in stored wallets
      const storedWallets = JSON.parse(localStorage.getItem("stored-wallets") || "[]")
      const matchingWallet = storedWallets.find((wallet: any) => wallet.mnemonic === mnemonic.trim())

      if (matchingWallet) {
        // TODO: In production, verify password against encrypted private key
        // Restore existing wallet
        setRestoredWallet(matchingWallet)

        // Update session storage with improved persistence
        localStorage.setItem(
          "bsv-wallet-session",
          JSON.stringify({
            address: matchingWallet.publicAddress,
            type: matchingWallet.type,
            timestamp: Date.now(),
          }),
        )

        localStorage.setItem(
          "devWalletData",
          JSON.stringify({
            publicAddress: matchingWallet.publicAddress,
            type: matchingWallet.type,
          }),
        )

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent("bsvWalletUpdated", { detail: matchingWallet }))
      } else {
        // TODO: In production, restore from BSV blockchain using mnemonic + password
        setError("Wallet not found or incorrect password. Please check your recovery phrase and password.")
      }
    } catch (error) {
      console.error("Error restoring wallet:", error)
      setError("Failed to restore wallet. Please try again.")
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreFromStored = (wallet: any) => {
    // Restore wallet from stored wallets with improved persistence
    setRestoredWallet(wallet)

    // Update session storage
    localStorage.setItem(
      "bsv-wallet-session",
      JSON.stringify({
        address: wallet.publicAddress,
        type: wallet.type,
        timestamp: Date.now(),
      }),
    )

    localStorage.setItem(
      "devWalletData",
      JSON.stringify({
        publicAddress: wallet.publicAddress,
        type: wallet.type,
      }),
    )

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent("bsvWalletUpdated", { detail: wallet }))
  }

  const handleDeleteStoredWallet = (walletId: string) => {
    const updatedWallets = storedWallets.filter((w) => w.id !== walletId)
    setStoredWallets(updatedWallets)
    localStorage.setItem("stored-wallets", JSON.stringify(updatedWallets))
  }

  const handleContinue = () => {
    if (restoredWallet?.type === "merchant") {
      window.location.href = "/merchant"
    } else {
      window.location.href = "/customer"
    }
  }

  if (restoredWallet) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Wallet Restored Successfully!</CardTitle>
          <CardDescription>Your BSV wallet has been restored and is ready to use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {restoredWallet.type === "merchant" ? (
                  <Store className="h-5 w-5 text-blue-600" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold capitalize">{restoredWallet.type} Wallet</h3>
                <p className="text-sm text-slate-600">Ready to use</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600">Address:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded text-xs">{restoredWallet.publicAddress}</code>
              </div>
              <div>
                <span className="text-slate-600">Created:</span>
                <span className="ml-2">{new Date(restoredWallet.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Restore BSV Wallet</CardTitle>
          <CardDescription>Enter your recovery phrase and password to restore your wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="mnemonic">Recovery Phrase</Label>
            <Textarea
              id="mnemonic"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter your 12 or 24 word recovery phrase..."
              rows={4}
              className="font-mono resize-none"
            />
            <p className="text-sm text-slate-600">
              Enter the words separated by spaces, exactly as they were given to you when creating your wallet.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wallet Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your wallet password"
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

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Your wallet type (customer or merchant) will be automatically detected from the
              blockchain.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleRestoreWallet}
            disabled={isRestoring || !mnemonic.trim() || !password.trim()}
            className="w-full"
          >
            {isRestoring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Restoring Wallet...
              </>
            ) : (
              "Restore Wallet"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previously Created Wallets */}
      {storedWallets.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Previously Created Wallets</CardTitle>
            <CardDescription>Quick restore from wallets created on this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storedWallets.map((wallet) => (
                <Card key={wallet.id} className="transition-all hover:shadow-md cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {wallet.type === "merchant" ? (
                            <Store className="h-5 w-5 text-blue-600" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{wallet.type} Wallet</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {wallet.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            {wallet.publicAddress.substring(0, 12)}...{wallet.publicAddress.substring(-8)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Created {new Date(wallet.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRestoreFromStored(wallet)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Restore
                        </Button>
                        <Button
                          onClick={() => handleDeleteStoredWallet(wallet.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}