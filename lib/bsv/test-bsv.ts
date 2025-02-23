'use client'

import { PrivKey, PubKey, Address } from 'bsv'

export interface TestResult {
  success: boolean
  error?: string
  data?: {
    privateKey?: string
    publicKey?: string
    address?: string
  }
}

export async function testBSVFunctionality(): Promise<TestResult> {
  try {
    console.log('Testing BSV functionality...')
    
    // Generate random bytes for private key (33 bytes for uncompressed)
    const randomBytes = new Uint8Array(33)
    window.crypto.getRandomValues(randomBytes)
    // Set the first byte to indicate uncompressed format
    randomBytes[0] = 0x80 // Version byte for uncompressed private key
    console.log('Random bytes generated:', randomBytes)
    
    // Create private key from random bytes
    const privateKey = PrivKey.fromBuffer(Buffer.from(randomBytes))
    console.log('Private key created:', privateKey)
    
    // Test public key derivation
    const publicKey = PubKey.fromPrivKey(privateKey)
    console.log('Public key derived:', publicKey)
    
    // Test address generation
    const address = Address.fromPubKey(publicKey)
    console.log('Address generated:', address)

    return {
      success: true,
      data: {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        address: address.toString()
      }
    }
  } catch (error) {
    console.error('BSV Test Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}