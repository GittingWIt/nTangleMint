'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { restoreWallet, WalletInfo } from '../bsvUtilities/bsvWallet'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function CreateRestoreWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [privateKey, setPrivateKey] = useState('')
  const [entityType, setEntityType] = useState<'user' | 'merchant'>('user')
  const router = useRouter()

  const handleCreateWallet = () => {
    router.push('/wallet-generation')
  }

  const handleRestoreWallet = () => {
    if (privateKey) {
      try {
        const restoredWallet = restoreWallet(privateKey)
        setWalletInfo(restoredWallet)
      } catch (error) {
        console.error('Failed to restore wallet:', error)
        // You might want to show an error message to the user here
      }
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Create or Restore Wallet</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Entity Type</CardTitle>
          <CardDescription>Choose whether you are a user or a merchant</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={entityType} onValueChange={(value) => setEntityType(value as 'user' | 'merchant')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user" />
              <Label htmlFor="user">User</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merchant" id="merchant" />
              <Label htmlFor="merchant">Merchant</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Wallet Management</CardTitle>
          <CardDescription>Create a new wallet or restore an existing one for {entityType}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={handleCreateWallet} className="w-full">Create New Wallet</Button>
          </div>
          <div className="text-center">or</div>
          <div>
            <Input
              placeholder="Enter your private key to restore wallet"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleRestoreWallet} className="w-full">Restore Wallet</Button>
          </div>
        </CardContent>
      </Card>

      {walletInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Entity Type:</strong> {entityType}</p>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Public Key:</strong> {walletInfo.publicKey}</p>
            <p><strong>Private Key:</strong> {walletInfo.privateKey}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}