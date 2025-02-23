"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { generateWallet, restoreWallet } from "@/lib/bsv/wallet"
import { clearWalletData } from "@/lib/storage"

interface WalletState {
  mnemonic: string
  publicAddress: string
  type: "user" | "merchant"
}

type TestPhase = "initial" | "created" | "logged_out" | "restoring" | "restored"

// Add this warning component
function TestWarning() {
  return (
    <Alert className="mb-4">
      <AlertDescription>
        <strong>Test Environment Only:</strong> In production, mnemonics and sensitive wallet data will never be stored
        or displayed. Users must securely store and enter their mnemonic phrase for wallet restoration.
      </AlertDescription>
    </Alert>
  )
}

export default function WalletLifecycleTest() {
  // Test state
  const [phase, setPhase] = useState<TestPhase>("initial")
  const [restorationInput, setRestorationInput] = useState("")

  // Wallet state
  const [originalWallet, setOriginalWallet] = useState<WalletState | null>(null)
  const [restoredWallet, setRestoredWallet] = useState<WalletState | null>(null)
  const [password, setPassword] = useState("")
  const [walletType, setWalletType] = useState<"user" | "merchant">("user")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await clearWalletData()

      const wallet = await generateWallet(password || undefined, walletType)
      setOriginalWallet({
        mnemonic: wallet.mnemonic,
        publicAddress: wallet.publicAddress,
        type: wallet.type,
      })
      setPhase("created")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await clearWalletData()
      setPhase("logged_out")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear wallet data")
    } finally {
      setIsLoading(false)
    }
  }

  const startRestoration = () => {
    setRestorationInput("")
    setPhase("restoring")
  }

  const restoreWalletFromMnemonic = async () => {
    if (!restorationInput.trim()) {
      setError("Please enter the mnemonic phrase")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const wallet = await restoreWallet(restorationInput.trim(), password || undefined, walletType)
      setRestoredWallet({
        mnemonic: wallet.mnemonic,
        publicAddress: wallet.publicAddress,
        type: wallet.type,
      })
      setPhase("restored")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const resetTest = () => {
    setPhase("initial")
    setOriginalWallet(null)
    setRestoredWallet(null)
    setRestorationInput("")
    setError(null)
    clearWalletData()
  }

  const addressesMatch =
    originalWallet && restoredWallet && originalWallet.publicAddress === restoredWallet.publicAddress

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Lifecycle Test</CardTitle>
          <CardDescription>Test wallet creation, logout, and restoration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TestWarning />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={phase !== "initial"}
              />
            </div>

            <Tabs
              value={walletType}
              onValueChange={(value) => setWalletType(value as "user" | "merchant")}
              disabled={phase !== "initial"}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User Wallet</TabsTrigger>
                <TabsTrigger value="merchant">Merchant Wallet</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-4">
              {phase === "initial" && (
                <Button onClick={createWallet} disabled={isLoading}>
                  Create New Wallet
                </Button>
              )}

              {phase === "created" && (
                <Button onClick={logout} disabled={isLoading}>
                  Logout
                </Button>
              )}

              {phase === "logged_out" && (
                <Button onClick={startRestoration} disabled={isLoading}>
                  Start Restoration
                </Button>
              )}

              {phase === "restoring" && (
                <Button onClick={restoreWalletFromMnemonic} disabled={isLoading || !restorationInput.trim()}>
                  Restore Wallet
                </Button>
              )}

              {phase !== "initial" && (
                <Button onClick={resetTest} variant="outline">
                  Reset Test
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {originalWallet && (
              <div className="space-y-2">
                <h3 className="font-semibold">Original Wallet</h3>
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                  <div className="break-all">
                    <span className="font-medium">Mnemonic:</span> {originalWallet.mnemonic}
                  </div>
                  <div className="break-all">
                    <span className="font-medium">Address:</span> {originalWallet.publicAddress}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {originalWallet.type}
                  </div>
                </div>
              </div>
            )}

            {phase === "logged_out" && (
              <Alert>
                <AlertDescription>
                  Wallet data has been cleared. Click "Start Restoration" to begin the restoration process.
                </AlertDescription>
              </Alert>
            )}

            {phase === "restoring" && (
              <div className="space-y-2">
                <Label htmlFor="mnemonic">Enter Mnemonic to Restore</Label>
                <Textarea
                  id="mnemonic"
                  value={restorationInput}
                  onChange={(e) => setRestorationInput(e.target.value)}
                  placeholder="Enter the mnemonic phrase to restore your wallet"
                  className="font-mono"
                />
              </div>
            )}

            {restoredWallet && (
              <div className="space-y-2">
                <h3 className="font-semibold">Restored Wallet</h3>
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                  <div className="break-all">
                    <span className="font-medium">Address:</span> {restoredWallet.publicAddress}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {restoredWallet.type}
                  </div>
                  <Badge variant={addressesMatch ? "success" : "destructive"}>
                    {addressesMatch ? "Addresses Match" : "Addresses Mismatch"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}