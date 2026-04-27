"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createWallet } from "@/lib/services/wallet-create"
import { restoreWallet } from "@/lib/services/wallet-restore"
import { validateMnemonic, getCurrentWallet } from "@/lib/services/wallet-service"
import { useWallet } from "@/contexts/wallet-context"
import { useWalletRedirect } from "@/hooks/useWalletRedirect"
import { getNetworkMode } from "@/lib/services/bsv-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Wallet, Eye, EyeOff, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ReCaptcha } from "@/components/recaptcha"

export default function WalletPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { wallet, isLoading: walletLoading } = useWallet()
  const { setWallet } = useWallet()
  const redirectProgram = searchParams.get("redirect")

  // State declarations
  const [activeTab, setActiveTab] = useState<"create" | "restore">("create")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState("")
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  // Use wallet redirect hook - redirects to dashboard if wallet exists (unless showing seed phrase)
  useWalletRedirect({
    redirectToWalletWhenExists: true,
    skipCondition: !!generatedMnemonic // Skip redirect while showing seed phrase
  })

  // Clear any old pending mnemonic from previous sessions on mount
  useEffect(() => {
    sessionStorage.removeItem("ntanglemint_pending_mnemonic")
  }, [])

  const networkMode = getNetworkMode()

  const handleCreateWallet = async () => {
    setError("")

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const { wallet: newWallet, mnemonic: newMnemonic } = await createWallet(password)

      // Sync wallet to context
      setWallet(newWallet)

      setGeneratedMnemonic(newMnemonic)
      console.log("[v0] Wallet created successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreWallet = async () => {
    setError("")

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification")
      return
    }

    if (!mnemonic.trim()) {
      setError("Please enter your recovery phrase")
      return
    }

    if (!validateMnemonic(mnemonic)) {
      setError("Invalid recovery phrase. Must be 12 words.")
      return
    }

    setIsLoading(true)

    try {
      // Restore wallet - unified wallet with both capabilities
      const restoredWallet = await restoreWallet(mnemonic, password)

      // Sync wallet to context
      setWallet(restoredWallet)
      
      // Redirect to unified dashboard
      if (redirectProgram) {
        router.push(`/dashboard?join=${redirectProgram}`)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAfterCreate = () => {
    // Wallet is created locally and ready to use immediately
    // On-chain WALLET registration will happen automatically when the wallet first receives funds
    if (redirectProgram) {
      router.push(`/dashboard?join=${redirectProgram}`)
    } else {
      router.push("/dashboard")
    }
  }

  const copyMnemonic = () => {
    if (generatedMnemonic) {
      navigator.clipboard.writeText(generatedMnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              nTangle<span className="text-primary">Mint</span> Wallet
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {networkMode === "testnet" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                  TESTNET MODE
                </span>
              )}
            </p>
          </div>

          {/* If we just created a wallet and have mnemonic, show backup screen */}
          {generatedMnemonic ? (
            <div key="mnemonic-backup" className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Save Your Recovery Phrase</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                  Write down these 12 words in order. You&apos;ll need them to restore your wallet. Do NOT share this phrase with anyone.
                </p>

                <div className="bg-white dark:bg-background rounded-lg p-6 font-mono text-sm border border-amber-200 dark:border-amber-800 mb-4 break-words">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {generatedMnemonic.split(" ").map((word, idx) => (
                      <div key={`${idx}-${word}`} className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">{idx + 1}.</span>
                        <span className="font-mono font-bold text-foreground">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={copyMnemonic}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✓ Write down all 12 words in the exact order shown<br/>
                  ✓ Store them in a safe place<br/>
                  ✓ Never share your recovery phrase online
                </p>
              </div>

              <Button className="w-full" onClick={handleContinueAfterCreate}>
                I&apos;ve Saved My Phrase - Continue
              </Button>
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "restore")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="create">Create New</TabsTrigger>
                  <TabsTrigger value="restore">Restore</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your wallet supports both user and creator capabilities. Access both from your dashboard.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                  <ReCaptcha onVerify={setRecaptchaToken} />

                  <Button className="w-full" onClick={handleCreateWallet} disabled={isLoading || !recaptchaToken}>
                    {isLoading ? "Creating..." : "Create Wallet"}
                  </Button>
                </TabsContent>

                <TabsContent value="restore" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Restore your wallet using your 12-word recovery phrase. Your wallet will have both user and creator capabilities.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mnemonic">Recovery Phrase</Label>
                    <textarea
                      id="mnemonic"
                      className="w-full min-h-24 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter your 12-word recovery phrase"
                      value={mnemonic}
                      onChange={(e) => setMnemonic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restorePassword">Password (optional)</Label>
                    <Input
                      id="restorePassword"
                      type="password"
                      placeholder="Enter password if you used one"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                  <ReCaptcha onVerify={setRecaptchaToken} />

                  <Button className="w-full" onClick={handleRestoreWallet} disabled={isLoading || !recaptchaToken}>
                    {isLoading ? "Restoring..." : "Restore Wallet"}
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  )
}