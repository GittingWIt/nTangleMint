'use client'

import { useState } from 'react';
import { createNewWallet, restoreWallet } from '../bsvUtilities/bsvWallet';
import { mintBSV20Token } from '../bsvUtilities/bsvTokens';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export default function CreateRestoreWallet() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [mnemonicPhrase, setMnemonicPhrase] = useState('');

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

  const handleMintBSV20 = async () => {
    if (walletInfo) {
      try {
        const txid = await mintBSV20Token(walletInfo.address, walletInfo.privateKey, 'NTANGLE', 1000);
        console.log('BSV20 token minted, transaction ID:', txid);
      } catch (error) {
        console.error('Error minting BSV20 token:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Create or Restore Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Wallet</CardTitle>
            <CardDescription>Generate a new Bitcoin SV wallet</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreateNewWallet}>Create New Wallet</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore Wallet</CardTitle>
            <CardDescription>Recover your wallet using a 12-word seed phrase</CardDescription>
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
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Private Key:</strong> {walletInfo.privateKey}</p>
            <p><strong>Mnemonic:</strong> {walletInfo.mnemonic}</p>
            <div className="mt-4">
              <Button onClick={handleMintBSV20}>Mint BSV20 Token</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}