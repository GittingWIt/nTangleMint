"use client"

import bsv from "bsv"

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
    console.log("Testing BSV functionality...")

    // Generate random bytes for private key (32 bytes)
    const randomBytes = new Uint8Array(32)
    window.crypto.getRandomValues(randomBytes)
    console.log("Random bytes generated:", randomBytes)

    // Create private key from random bytes
    const privateKey = bsv.PrivateKey.fromRandom()
    console.log("Private key created:", privateKey)

    // Test public key derivation
    const publicKey = privateKey.toPublicKey()
    console.log("Public key derived:", publicKey)

    // Test address generation using default network settings
    const address = privateKey.toAddress()
    console.log("Address generated:", address)

    return {
      success: true,
      data: {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        address: address.toString(),
      },
    }
  } catch (error) {
    console.error("BSV Test Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}