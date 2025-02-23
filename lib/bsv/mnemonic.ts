import { generateMnemonic as bip39GenerateMnemonic, validateMnemonic as bip39ValidateMnemonic } from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english"

function getRandomValues(length: number): Uint8Array {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required")
  }

  const crypto = window.crypto
  if (!crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available")
  }

  const buffer = new Uint8Array(length)

  try {
    crypto.getRandomValues(buffer)

    if (buffer.every((b) => b === 0)) {
      throw new Error("Generated buffer contains all zeros")
    }

    return buffer
  } catch (error) {
    console.error("[getRandomValues] Error:", error)
    throw new Error("Failed to generate secure random values")
  }
}

export async function generateMnemonic(): Promise<string> {
  try {
    if (!Array.isArray(wordlist) || wordlist.length !== 2048) {
      throw new Error("Invalid wordlist configuration")
    }

    // Generate entropy
    const entropy = getRandomValues(16)
    console.log("[generateMnemonic] Generated entropy buffer:", Array.from(entropy))

    try {
      // Generate mnemonic with explicit strength parameter
      const mnemonic = bip39GenerateMnemonic(wordlist)
      console.log("[generateMnemonic] Generated mnemonic first word:", mnemonic.split(" ")[0])

      if (!mnemonic || mnemonic.split(" ").length !== 12) {
        throw new Error("Generated mnemonic has incorrect length")
      }

      return mnemonic
    } catch (mnemonicError) {
      console.error("[generateMnemonic] Mnemonic generation error:", mnemonicError)
      throw new Error("Failed to generate mnemonic from entropy")
    }
  } catch (error) {
    console.error("[generateMnemonic] Error:", error)
    console.debug("[generateMnemonic] Debug:", {
      wordlistAvailable: !!wordlist,
      wordlistLength: wordlist?.length,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("Failed to generate wallet recovery phrase")
  }
}

export function validateMnemonic(mnemonic: string): boolean {
  if (!mnemonic) return false

  try {
    if (!Array.isArray(wordlist) || wordlist.length !== 2048) {
      throw new Error("Invalid wordlist configuration")
    }

    return bip39ValidateMnemonic(mnemonic.trim().toLowerCase(), wordlist)
  } catch (error) {
    console.error("[validateMnemonic] Error:", error)
    return false
  }
}