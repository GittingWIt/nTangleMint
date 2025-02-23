"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { restoreWallet, validateMnemonic } from "@/lib/bsv/wallet"
import { setWalletData, getStoredWalletType, getWalletData, clearWalletData } from "@/lib/storage"
import type { WalletData } from "@/types"
import dynamic from "next/dynamic"

interface ValidationState {
  isValid: boolean
  storedType: "user" | "merchant" | null
  error?: string
}

// Key format validation
const PRIVATE_KEY_REGEX = /^[KL][1-9A-HJ-NP-Za-km-z]{51}$/
const PUBLIC_KEY_REGEX = /^02|03[0-9A-Fa-f]{64}$/
const ADDRESS_REGEX = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/

const RestoreWalletForm = dynamic(() => Promise.resolve(RestoreWalletFormComponent), { ssr: false })

export default RestoreWalletForm

function RestoreWalletFormComponent() {
  const [mnemonic, setMnemonic] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [validation, setValidation] = useState<ValidationState | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const validateKeyFormats = (wallet: WalletData): boolean => {
    const isValidPrivateKey = PRIVATE_KEY_REGEX.test(wallet.privateKey)
    const isValidPublicKey = PUBLIC_KEY_REGEX.test(wallet.publicKey)
    const isValidAddress = ADDRESS_REGEX.test(wallet.publicAddress)

    console.log("[Form] Key format validation:", {
      privateKey: isValidPrivateKey,
      publicKey: isValidPublicKey,
      address: isValidAddress,
    })

    return isValidPrivateKey && isValidPublicKey && isValidAddress
  }

  const verifyWalletData = async (wallet: WalletData): Promise<boolean> => {
    try {
      // Validate key formats first
      if (!validateKeyFormats(wallet)) {
        console.error("[Form] Wallet data failed format validation")
        return false
      }

      // Clear any existing data first
      await clearWalletData()

      // Store the new wallet data
      await setWalletData(wallet)

      // Verify storage
      const storedData = await getWalletData()
      if (!storedData) {
        console.error("[Form] No wallet data found after storage")
        return false
      }

      const isValid =
        storedData.publicAddress === wallet.publicAddress &&
        storedData.type === wallet.type &&
        storedData.privateKey === wallet.privateKey &&
        storedData.publicKey === wallet.publicKey &&
        storedData.mnemonic === wallet.mnemonic

      console.log("[Form] Wallet verification:", {
        addressMatch: storedData.publicAddress === wallet.publicAddress,
        typeMatch: storedData.type === wallet.type,
        keyMatch: storedData.privateKey === wallet.privateKey,
        mnemonicMatch: storedData.mnemonic === wallet.mnemonic,
      })

      return isValid
    } catch (err) {
      console.error("[Form] Verification error:", err)
      return false
    }
  }

  const handleValidateMnemonic = async () => {
    setIsValidating(true)
    setError("")
    setValidation(null)

    try {
      const normalizedMnemonic = mnemonic.trim().toLowerCase()
      console.log("[Form] Validating mnemonic")

      // Clear any existing wallet data
      await clearWalletData()

      const isValid = validateMnemonic(normalizedMnemonic)
      if (!isValid) {
        throw new Error("Invalid recovery phrase")
      }

      const storedType = await getStoredWalletType(normalizedMnemonic)
      console.log("[Form] Mnemonic validation successful, stored type:", storedType)

      setValidation({
        isValid: true,
        storedType,
      })
    } catch (err) {
      console.error("[Form] Validation error:", err)
      setValidation({
        isValid: false,
        storedType: null,
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
      if (!validation?.isValid || !validation.storedType) {
        throw new Error("Please validate your recovery phrase first")
      }

      const normalizedMnemonic = mnemonic.trim().toLowerCase()
      console.log("[Form] Starting wallet restoration")

      // Clear any existing wallet data
      await clearWalletData()

      // Attempt restoration with password
      const wallet = await restoreWallet(normalizedMnemonic, password, validation.storedType)
      console.log("[Form] Wallet restored:", {
        type: wallet.type,
        address: wallet.publicAddress,
      })

      // Verify wallet data format and storage
      const isVerified = await verifyWalletData(wallet)
      if (!isVerified) {
        throw new Error("Wallet restoration verification failed")
      }

      // Final verification before redirect
      const finalCheck = await getWalletData()
      if (!finalCheck || finalCheck.publicAddress !== wallet.publicAddress) {
        throw new Error("Final wallet verification failed")
      }

      // Add a small delay before redirect
      await new Promise((resolve) => setTimeout(resolve, 500))

      window.location.href = `/${wallet.type}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore wallet")
      setValidation(null)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="grid gap-2">
        <Label htmlFor="mnemonic">Recovery Phrase</Label>
        <Input
          id="mnemonic"
          placeholder="Enter your 12-word recovery phrase"
          value={mnemonic}
          onChange={(e) => {
            setMnemonic(e.target.value)
            setValidation(null)
            setError("")
          }}
        />
        <Button
          onClick={handleValidateMnemonic}
          variant="outline"
          className="w-full"
          disabled={isValidating || !mnemonic.trim()}
        >
          {isValidating ? "Validating..." : "Validate Phrase"}
        </Button>
      </div>

      {validation?.isValid && (
        <div className="grid gap-2">
          <Label htmlFor="password">Password (optional)</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      {validation?.isValid && (
        <Alert variant="success" className="mt-4">
          <AlertDescription>Recovery phrase is valid for {validation.storedType} wallet</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        disabled={isRestoring || !validation?.isValid || !mnemonic.trim()}
        onClick={handleRestoreWallet}
      >
        {isRestoring ? "Restoring..." : "Restore Wallet"}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { RestoreWalletFormComponent }