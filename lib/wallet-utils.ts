import { generateMnemonic as genMnemonic, validateMnemonic as validateMnem, mnemonicToSeedSync } from 'bip39'
import { HDKey } from '@scure/bip32'
import { sha256 } from '@noble/hashes/sha256'
import { ripemd160 } from '@noble/hashes/ripemd160'
import bs58 from 'bs58'

export interface WalletData {
  type: 'merchant' | 'user'
  publicAddress: string
  mnemonic: string
}

// Check if we're on the client side
const isClient = typeof window !== 'undefined'

// Generate a cryptographically secure mnemonic
export function generateMnemonic(): string {
  return genMnemonic(256) // 24 words for extra security
}

// Validate a mnemonic phrase
export function validateMnemonic(mnemonic: string): boolean {
  return validateMnem(mnemonic)
}

// Generate a BSV address from a mnemonic
export function generateBSVAddress(mnemonic: string): string {
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

// Save wallet data to local storage
export function saveWalletData(data: WalletData): void {
  if (!isClient) return
  localStorage.setItem('walletData', JSON.stringify(data))
}

// Get wallet data from local storage
export function getWalletData(): WalletData | null {
  if (!isClient) return null
  const data = localStorage.getItem('walletData')
  return data ? JSON.parse(data) : null
}

// Clear wallet data from local storage
export function clearWalletData(): void {
  if (!isClient) return
  localStorage.removeItem('walletData')
}

// Shorten address for display
export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Generate a new wallet
export function generateNewWallet(type: 'merchant' | 'user'): WalletData {
  const mnemonic = generateMnemonic()
  const publicAddress = generateBSVAddress(mnemonic)
  
  return {
    type,
    publicAddress,
    mnemonic
  }
}

// Restore a wallet from mnemonic
export function restoreWallet(type: 'merchant' | 'user', mnemonic: string): WalletData | null {
  if (!validateMnemonic(mnemonic)) {
    return null
  }

  const publicAddress = generateBSVAddress(mnemonic)
  
  return {
    type,
    publicAddress,
    mnemonic
  }
}

// Handle wallet logout
export function logoutWallet(): void {
  if (!isClient) return
  clearWalletData()
  // Reload the page to reset the app state
  window.location.href = '/'
}