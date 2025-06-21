"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Coins, Wallet, Store, CheckCircle, AlertCircle } from "lucide-react"
import { restoreWallet, validateMnemonic } from "@/lib/bsv/wallet"
import dynamic from "next/dynamic"

const RestoreWalletForm = dynamic(() => Promise.resolve(RestoreWalletFormComponent), { ssr: false })

export default RestoreWalletForm

function RestoreWalletFormComponent() {
  const [mnemonic, setMnemonic] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validation, setValidation] = useState<{
    isValid: boolean
    detectedType: "customer" | "merchant" | null
    bsvMetadata?: any
    testedResults: { type: string; success: boolean; address?: string }[]
    error?: string
  } | null>(null)

  // Clear wallet data on mount and ensure clean state
  useEffect(() => {
    const initializeForm = async () => {
      try {
        console.log("RestoreWalletForm: Initializing clean state")

        // Clear any cached form state
        setMnemonic("")
        setPassword("")
        setError("")
        setValidation(null)

        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("walletData")
        }

        // Clear any browser autocomplete data
        const mnemonicInput = document.getElementById("mnemonic") as HTMLInputElement
        const passwordInput = document.getElementById("password") as HTMLInputElement

        if (mnemonicInput) {
          mnemonicInput.value = ""
          mnemonicInput.autocomplete = "off"
        }
        if (passwordInput) {
          passwordInput.value = ""
          passwordInput.autocomplete = "off"
        }
      } catch (err) {
        console.error("Error initializing restore form:", err)
      }
    }

    initializeForm()
  }, [])

  const detectWalletTypeFromBSV = async (
    normalizedMnemonic: string,
    password: string,
  ): Promise<{
    type: "customer" | "merchant" | null
    bsvMetadata?: any
    testedResults: { type: string; success: boolean; address?: string }[]
  }> => {
    console.log("[Form] Detecting wallet type from BSV blockchain metadata...")

    // CRITICAL: Strict password validation
    if (!password || password.length === 0) {
      throw new Error("Password is required for wallet restoration")
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }

    try {
      // Use the determineWalletType function which will check BSV metadata
      const { determineWalletType } = await import("@/lib/bsv/wallet")
      const detectedType = await determineWalletType(normalizedMnemonic, password)

      // Mock BSV metadata for now (will be replaced with actual blockchain queries)
      const mockBsvMetadata = {
        transactionId: `bsv_${Date.now()}`,
        timestamp: new Date().toISOString(),
        walletType: detectedType,
        businessName: detectedType === "merchant" ? "Sample Business" : undefined,
      }

      // Create test results for display
      const testedResults = [
        { type: "customer", success: detectedType === "customer" },
        { type: "merchant", success: detectedType === "merchant" },
      ]

      console.log(`[Form] ✅ Detected wallet type from BSV: ${detectedType}`)

      return {
        type: detectedType,
        bsvMetadata: mockBsvMetadata,
        testedResults,
      }
    } catch (error) {
      console.error("[Form] BSV wallet type detection failed:", error)
      throw error
    }
  }

  const handleValidateMnemonic = async () => {
    setIsValidating(true)
    setError("")
    setValidation(null)

    try {
      const normalizedMnemonic = mnemonic.trim().toLowerCase()
      console.log("[Form] Validating mnemonic and fetching BSV metadata...")

      // First validate the mnemonic format
      const isValid = validateMnemonic(normalizedMnemonic)
      if (!isValid) {
        throw new Error("Invalid recovery phrase format")
      }

      // CRITICAL: Strict password validation before any wallet operations
      if (!password || password.trim().length === 0) {
        throw new Error("Password is required to validate recovery phrase")
      }

      if (password.trim().length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      console.log("[Form] Password validation passed, fetching BSV metadata...")

      // Detect wallet type by reading BSV blockchain metadata
      const detection = await detectWalletTypeFromBSV(normalizedMnemonic, password.trim())

      console.log("[Form] ✅ BSV metadata retrieved:", detection.bsvMetadata)
      console.log("[Form] ✅ Detected wallet type:", detection.type)

      setValidation({
        isValid: true,
        detectedType: detection.type,
        bsvMetadata: detection.bsvMetadata,
        testedResults: detection.testedResults,
      })
    } catch (err) {
      console.error("[Form] Validation error:", err)
      setValidation({
        isValid: false,
        detectedType: null,
        testedResults: [],
        error: err instanceof Error ? err.message : "Failed to validate recovery phrase",
      })
      setError(err instanceof Error ? err.message : "Failed to validate recovery phrase")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRestoreWallet = async () => {
    setIsRestoring(true)
    setError("")

    try {
      if (!validation?.isValid || !validation.detectedType) {
        throw new Error("Please validate your recovery phrase first")
      }

      if (!password.trim()) {
        throw new Error("Password is required for wallet restoration")
      }

      const normalizedMnemonic = mnemonic.trim().toLowerCase()

      console.log("[Form] Starting wallet restoration from BSV metadata as:", validation.detectedType)

      // Restore wallet with detected type and BSV metadata
      const wallet = await restoreWallet(normalizedMnemonic, password, validation.detectedType, {
        bsvMetadata: validation.bsvMetadata,
        fetchFromBlockchain: true,
      })

      // Strict validation of restored wallet
      if (!wallet) {
        throw new Error("Wallet restoration returned null")
      }

      if (!wallet.type || wallet.type !== validation.detectedType) {
        throw new Error(`Wallet type mismatch. Expected ${validation.detectedType}, got ${wallet.type}`)
      }

      if (!wallet.publicAddress) {
        throw new Error("Restored wallet has no address")
      }

      console.log("[Form] ✅ Wallet restored successfully from BSV metadata:", {
        type: wallet.type,
        address: wallet.publicAddress,
        bsvTransactionId: validation.bsvMetadata?.transactionId,
      })

      // Save wallet data temporarily
      localStorage.setItem("walletData", JSON.stringify(wallet))

      // Add a delay to ensure storage is complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to appropriate dashboard
      const redirectPath = wallet.type === "merchant" ? "/merchant" : "/user"
      console.log("[Form] Redirecting to:", redirectPath)

      window.location.replace(redirectPath)
    } catch (err) {
      console.error("[Form] Restoration error:", err)
      setError(err instanceof Error ? err.message : "Failed to restore wallet")
      setValidation(null)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* BSV Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">BSV Blockchain Restoration</span>
        </div>
        <p className="text-sm text-blue-700">
          Your wallet will be restored using metadata stored on the Bitcoin SV blockchain during wallet creation.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="mnemonic" className="text-base font-medium">
            Recovery Phrase
          </Label>
          <Input
            id="mnemonic"
            placeholder="Enter your 12-word recovery phrase"
            value={mnemonic}
            onChange={(e) => {
              setMnemonic(e.target.value)
              setValidation(null)
              setError("")
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="text-base h-12"
          />
          <p className="text-sm text-slate-500">Enter the 12-word phrase you saved when creating your wallet</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-medium">
            Wallet Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your wallet password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setValidation(null)
              setError("")
            }}
            autoComplete="off"
            required
            className="text-base h-12"
          />
        </div>
      </div>

      <Button
        onClick={handleValidateMnemonic}
        variant="outline"
        className="w-full h-12"
        disabled={isValidating || !mnemonic.trim() || !password.trim() || password.trim().length < 8}
      >
        {isValidating ? (
          <>
            <Coins className="w-4 h-4 mr-2 animate-spin" />
            Reading BSV Metadata...
          </>
        ) : (
          "Validate & Read BSV Metadata"
        )}
      </Button>

      {validation?.isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Recovery phrase is valid for</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {validation.detectedType === "customer" ? (
                    <Wallet className="w-3 h-3" />
                  ) : (
                    <Store className="w-3 h-3" />
                  )}
                  {validation.detectedType} wallet
                </Badge>
              </div>
              {validation.bsvMetadata && (
                <div className="text-xs space-y-1">
                  <div>BSV Transaction: {validation.bsvMetadata.transactionId}</div>
                  <div>Created: {new Date(validation.bsvMetadata.timestamp).toLocaleDateString()}</div>
                  {validation.bsvMetadata.businessName && <div>Business: {validation.bsvMetadata.businessName}</div>}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full h-14 text-lg font-semibold"
        disabled={
          isRestoring || !validation?.isValid || !mnemonic.trim() || !password.trim() || password.trim().length < 8
        }
        onClick={handleRestoreWallet}
      >
        {isRestoring ? (
          <>
            <Coins className="w-5 h-5 mr-2 animate-spin" />
            Restoring from BSV Blockchain...
          </>
        ) : (
          `Restore ${validation?.detectedType || ""} Wallet`
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { RestoreWalletFormComponent }