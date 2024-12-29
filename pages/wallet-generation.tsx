'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, CheckCircle, Info, Copy, Check } from 'lucide-react'
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39'
import { HDKey } from '@scure/bip32'
import { sha256 } from '@noble/hashes/sha256'
import { ripemd160 } from '@noble/hashes/ripemd160'
import bs58 from 'bs58'

interface WalletFormData {
  password: string
  confirmPassword: string
  seedPhrase?: string
}

interface WalletGenerationError {
  message: string
}

interface WalletData {
  publicAddress: string
  type: 'user' | 'merchant'
  mnemonic: string
}

const determineWalletType = (publicAddress: string): 'user' | 'merchant' => {
  // This is a placeholder implementation - replace with actual logic
  // For example, you might check against a list of known merchant addresses
  // or use a specific address format/prefix for merchants
  const addressNum = parseInt(publicAddress.slice(-1), 16)
  return addressNum % 2 === 0 ? 'merchant' : 'user'
}

export default function WalletGeneration() {
  const router = useRouter()
  const [formData, setFormData] = useState<WalletFormData>({
    password: '',
    confirmPassword: '',
    seedPhrase: ''
  })
  const [walletType, setWalletType] = useState<'user' | 'merchant'>('user')
  const [mnemonic, setMnemonic] = useState<string>('')
  const [error, setError] = useState<WalletGenerationError | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'restore'>('create')

  const validatePasswords = (): boolean => {
    if (formData.password.length < 8) {
      setError({ message: 'Password must be at least 8 characters long' })
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError({ message: 'Passwords do not match' })
      return false
    }
    return true
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const generateBSVAddress = (mnemonic: string): string => {
    const seed = mnemonicToSeedSync(mnemonic)
    const hdKey = HDKey.fromMasterSeed(seed)
    const path = "m/44'/236'/0'/0/0" // BSV derivation path
    const child = hdKey.derive(path)
    
    if (!child.publicKey) throw new Error('Failed to derive public key')
    
    // Generate BSV address
    const publicKeyHash = ripemd160(sha256(child.publicKey))
    const version = new Uint8Array([0x00]) // Mainnet P2PKH
    const payload = new Uint8Array(21)
    payload.set(version)
    payload.set(publicKeyHash, 1)
    
    // Calculate checksum (first 4 bytes of double SHA256)
    const checksum = sha256(sha256(payload)).slice(0, 4)
    
    // Combine payload and checksum
    const addressBytes = new Uint8Array(25)
    addressBytes.set(payload)
    addressBytes.set(checksum, 21)
    
    // Encode as Base58
    return bs58.encode(addressBytes)
  }

  const generateSeed = async () => {
    if (!validatePasswords()) {
      return
    }

    setIsLoading(true)
    setError(null)
    setCopied(false)

    try {
      const newMnemonic = generateMnemonic(256) // 24 words
      const publicAddress = generateBSVAddress(newMnemonic)

      setMnemonic(newMnemonic)
      setSuccess(true)

      // Store wallet data
      const walletData: WalletData = {
        publicAddress,
        type: walletType,
        mnemonic: newMnemonic
      }
      localStorage.setItem('walletData', JSON.stringify(walletData))
    
      // Dispatch event to notify app of wallet update
      window.dispatchEvent(new Event('walletUpdated'))
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to generate seed phrase' 
      })
      setMnemonic('')
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const restoreWallet = async () => {
    if (!validatePasswords() || !formData.seedPhrase) {
      setError({ message: 'Please enter your seed phrase' })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const trimmedMnemonic = formData.seedPhrase.trim().toLowerCase()
      
      if (!validateMnemonic(trimmedMnemonic)) {
        throw new Error('Invalid seed phrase')
      }

      const publicAddress = generateBSVAddress(trimmedMnemonic)
      const determinedType = determineWalletType(publicAddress)

      const walletData: WalletData = {
        publicAddress,
        type: determinedType,
        mnemonic: trimmedMnemonic
      }

      // Store wallet data
      localStorage.setItem('walletData', JSON.stringify(walletData))
    
      // Dispatch event to notify app of wallet update
      window.dispatchEvent(new Event('walletUpdated'))

      // Redirect to appropriate dashboard
      router.push(determinedType === 'merchant' ? '/merchant' : '/user')
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to restore wallet' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyMnemonic = async () => {
    if (!mnemonic) return
    
    try {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError({
        message: 'Failed to copy seed phrase to clipboard'
      })
    }
  }

  const handleConfirmation = async () => {
    if (!mnemonic) return

    try {
      // Wallet data is already stored in localStorage during generateSeed
      // Just redirect based on user type
      router.push(walletType === 'merchant' ? '/merchant' : '/user')
    } catch (err) {
      setError({
        message: 'Failed to save wallet data'
      })
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Access</CardTitle>
          <CardDescription>
            Create a new wallet or restore an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'restore')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="restore">Restore</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <TabsContent value="create" className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <RadioGroup
                    value={walletType}
                    onValueChange={(value) => setWalletType(value as 'user' | 'merchant')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user">User</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merchant" id="merchant" />
                      <Label htmlFor="merchant">Merchant</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your seed phrase is the only way to recover your wallet. Keep it safe and never share it.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>

                {!mnemonic && (
                  <Button 
                    className="w-full" 
                    onClick={generateSeed}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate Seed'}
                  </Button>
                )}

                {mnemonic && (
                  <>
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Your Recovery Phrase:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={copyMnemonic}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {mnemonic.split(' ').map((word, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-xs text-muted-foreground mr-2">{index + 1}.</span>
                            <span className="font-mono text-sm">{word}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Write down these 24 words in order and store them securely.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="confirm" 
                        checked={confirmed}
                        onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                      />
                      <label
                        htmlFor="confirm"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have securely saved my recovery phrase
                      </label>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleConfirmation}
                      disabled={!confirmed}
                    >
                      Continue to Wallet
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="restore" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enter your 24-word seed phrase to restore your wallet
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your 24-word seed phrase, separated by spaces"
                    name="seedPhrase"
                    value={formData.seedPhrase}
                    onChange={(e) => setFormData(prev => ({ ...prev, seedPhrase: e.target.value }))}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={restoreWallet}
                  disabled={isLoading}
                >
                  {isLoading ? 'Restoring...' : 'Restore Wallet'}
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}