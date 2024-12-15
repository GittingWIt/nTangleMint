'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { createWallet, WalletInfo } from '../bsvUtilities/bsvWallet'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function WalletGeneration() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleGenerateSeed = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    setError('')
    const newWallet = createWallet()
    setWalletInfo(newWallet)
    // Here you would typically save the wallet info securely, possibly encrypting it with the password
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Wallet Generation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Wallet</CardTitle>
          <CardDescription>Enter a password to secure your new wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateSeed} className="w-full">Generate Seed</Button>
        </CardFooter>
      </Card>

      {walletInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Public Key:</strong> {walletInfo.publicKey}</p>
            <p><strong>Private Key:</strong> {walletInfo.privateKey}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}