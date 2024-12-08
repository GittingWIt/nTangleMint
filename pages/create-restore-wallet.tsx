'use client'

import { useState } from 'react';
import { createNewWallet, restoreWallet } from '../bsvUtilities/bsvWallet';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
<<<<<<< HEAD
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
=======
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf

// Define the WalletInfo type
interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export default function CreateRestoreWallet() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [mnemonicPhrase, setMnemonicPhrase] = useState('');
  const [entityType, setEntityType] = useState<'person' | 'merchant'>('person');

  const handleCreateNewWallet = () => {
    const newWallet = createNewWallet();
    setWalletInfo(newWallet);
  };

  const handleRestoreWallet = () => {
    if (mnemonicPhrase) {
      const restoredWallet = restoreWallet(mnemonicPhrase);
      setWalletInfo(restoredWallet);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Create or Restore Wallet</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Entity Type</CardTitle>
          <CardDescription>Choose whether you are a person or a merchant</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={entityType} onValueChange={(value) => setEntityType(value as 'person' | 'merchant')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="person" id="person" />
              <Label htmlFor="person">Person</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merchant" id="merchant" />
              <Label htmlFor="merchant">Merchant</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Wallet</CardTitle>
            <CardDescription>Generate a new Bitcoin SV wallet for {entityType}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreateNewWallet}>Create New Wallet</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore Wallet</CardTitle>
            <CardDescription>Recover your {entityType} wallet using a 12-word seed phrase</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter your 12-word seed phrase"
              value={mnemonicPhrase}
              onChange={(e) => setMnemonicPhrase(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleRestoreWallet}>Restore Wallet</Button>
          </CardFooter>
        </Card>
      </div>

      {walletInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Entity Type:</strong> {entityType}</p>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Private Key:</strong> {walletInfo.privateKey}</p>
            <p><strong>Mnemonic:</strong> {walletInfo.mnemonic}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}