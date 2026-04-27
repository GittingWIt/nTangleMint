"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { useWalletRedirect } from "@/hooks/useWalletRedirect"
import { getCurrentWallet } from "@/lib/services/wallet-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Copy, Check, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const router = useRouter()
  const { wallet } = useWallet()
  const [showMnemonicPhrase, setShowMnemonicPhrase] = useState(false)
  const [mnemonicPhrase, setMnemonicPhrase] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [showRevealDialog, setShowRevealDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Use wallet redirect hook - redirects to wallet if no wallet exists
  useWalletRedirect({
    redirectToWalletWhenExists: false
  })

  const handleCopyMnemonicPhrase = async () => {
    if (!mnemonicPhrase.trim()) return
    try {
      await navigator.clipboard.writeText(mnemonicPhrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy recovery phrase:", err)
    }
  }

  const handleRevealMnemonicPhrase = async () => {
    setPasswordError("")
    setIsLoading(true)

    try {
      // Get the current wallet which has the mnemonic stored
      if (wallet && wallet.mnemonic) {
        setMnemonicPhrase(wallet.mnemonic)
        setShowMnemonicPhrase(true)
        setShowRevealDialog(false)
      } else {
        setPasswordError("Unable to retrieve recovery phrase. Please try creating a new wallet.")
      }
    } catch (error) {
      setPasswordError("Failed to retrieve recovery phrase. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-1 ml-64 p-8">
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and security settings</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="security" className="space-y-6">
          <TabsList>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="general" disabled>General Settings (Coming Soon)</TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Important Warning */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Your recovery phrase is the only way to restore access to your wallet. Keep it safe and never share it with anyone.
              </AlertDescription>
            </Alert>

            {/* Recovery Phrase Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Recovery Phrase</CardTitle>
                <CardDescription>
                  This 12-word phrase can be used to restore your wallet on any device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showMnemonicPhrase ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        For security, your recovery phrase is hidden. Click the button below to reveal it.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={() => setShowRevealDialog(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal Recovery Phrase
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mnemonic Phrase Display */}
                    <div className="bg-muted p-4 rounded-lg border border-dashed">
                      <div className="grid grid-cols-3 gap-3 font-mono text-sm">
                        {mnemonicPhrase.split(" ").map((word, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-background rounded">
                            <span className="text-muted-foreground font-semibold min-w-fit">{index + 1}.</span>
                            <span className="break-all">{word}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <Button
                      onClick={handleCopyMnemonicPhrase}
                      className="w-full"
                      variant="secondary"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>

                    {/* Hide Button */}
                    <Button
                      onClick={() => {
                        setShowMnemonicPhrase(false)
                        setMnemonicPhrase("")
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Recovery Phrase
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Write down all 12 words in the correct order</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Store in a secure location (safe, safe deposit box, etc.)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Consider multiple copies in different secure locations</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Never share with anyone, including support staff</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Never store digitally (email, cloud, screenshots)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Never share on social media or public forums</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  We're working on additional settings options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Future settings will include:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Notification preferences</li>
                    <li>• Display preferences</li>
                    <li>• Data and privacy controls</li>
                    <li>• Account management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reveal Recovery Phrase Dialog */}
      <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reveal Recovery Phrase?</AlertDialogTitle>
            <AlertDialogDescription>
              Make sure you're in a private location where no one can see your screen. Your recovery phrase will be displayed in plain text.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                Never share your recovery phrase with anyone. nTangleMint support will never ask for it.
              </AlertDescription>
            </Alert>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevealMnemonicPhrase}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Verifying..." : "I Understand, Show It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}