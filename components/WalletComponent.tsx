"use client"

import type React from "react"
import { useState } from "react"
import { generateMnemonic, validateMnemonic } from "bip39"
import { setWalletData, getWalletData } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import type { WalletData } from "@/types"

const WalletComponent: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<string[]>([])

  const handleCreateWallet = async () => {
    try {
      const mnemonic = generateMnemonic()

      if (!validateMnemonic(mnemonic)) {
        throw new Error("Invalid mnemonic generated")
      }

      // Create wallet data with all required properties
      const walletData: WalletData = {
        type: "user",
        publicAddress: `bsv-${Date.now()}`,
        mnemonic: mnemonic,
        privateKey: "placeholder-private-key",
        publicKey: "placeholder-public-key",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setWalletData(walletData)
      const storedWalletData = await getWalletData()

      if (storedWalletData) {
        setWalletInfo([
          `Public Address: ${storedWalletData.publicAddress}`,
          `Wallet Type: ${storedWalletData.type}`,
          `Status: Wallet created successfully`,
        ])
      }
    } catch (error) {
      console.error("Error creating wallet:", error)
      setWalletInfo(["Error creating wallet. Please try again."])
    }
  }

  return (
    <div className="space-y-4">
      {walletInfo.length === 0 ? (
        <div className="text-center">
          <Button onClick={handleCreateWallet} className="w-full max-w-sm">
            Create New Wallet
          </Button>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-background">
          <ul className="space-y-2">
            {walletInfo.map((info, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {info}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default WalletComponent