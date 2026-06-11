/**
 * Wallet Validation
 *
 * Validates wallet data structures and formats.
 * Covers:
 * - Mnemonic validation (BIP39 compliance)
 * - Wallet ID format (application-level identifier only, NOT on-chain)
 * - BSV address format (blockchain address derived from private key)
 * - Private key and public key formats
 * - Balance structure
 * - Wallet state consistency
 *
 * Note: Identity on-chain is blockchain-native (TX signature), not stored identifiers.
 */

import { BSVAddressSchema } from './schemas'
import type { Wallet } from '@/lib/types'
import { z } from 'zod'

export interface WalletValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate BSV P2PKH address format
 * Used for blockchain operations (balance checks, transaction signing)
 * Derived from private key via BIP44
 */
export function validateBSVAddress(address: string): WalletValidationResult {
  try {
    BSVAddressSchema.parse(address)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => e.message)
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Invalid BSV address'] }
  }
}

/**
 * Validate wallet balance (satoshis)
 * Ensures wallet has sufficient balance for operations
 */
export function validateBalance(balance: number, required: number = 0): WalletValidationResult {
  const errors: string[] = []

  if (!Number.isInteger(balance)) {
    errors.push('Balance must be a whole number')
  }

  if (balance < 0) {
    errors.push('Balance cannot be negative')
  }

  if (balance < required) {
    errors.push(`Insufficient balance. Need ${required} satoshis, have ${balance}`)
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate wallet can perform operation
 * Checks balance and operational capacity
 */
export function validateOperationCapacity(balance: number, operationCost: number): WalletValidationResult {
  const errors: string[] = []

  // Validate balance format
  const balanceCheck = validateBalance(balance)
  if (!balanceCheck.valid) {
    errors.push(...(balanceCheck.errors || []))
  }

  // Validate operation cost
  if (!Number.isInteger(operationCost) || operationCost < 0) {
    errors.push('Operation cost must be a non-negative integer')
  }

  // Check if balance is sufficient
  if (balance < operationCost) {
    errors.push(
      `Insufficient balance for operation. Need ${operationCost} satoshis, have ${balance}`
    )
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate private key format (WIF - Wallet Import Format)
 * Used for transaction signing
 */
export function validatePrivateKeyFormat(privKey: string): WalletValidationResult {
  const errors: string[] = []

  if (!privKey) {
    errors.push('Private key required')
    return { valid: false, errors }
  }

  // WIF validation: starts with 'K' or 'L' (compressed) or '5' (uncompressed), 51-52 chars
  if (!/(^[KL][1-9A-HJ-NP-Z]{50}$)|(^5[1-9A-HJ-NP-Z]{50}$)/.test(privKey)) {
    errors.push('Invalid WIF private key format')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate public key format
 * Used for address derivation verification
 */
export function validatePublicKeyFormat(pubKey: string): WalletValidationResult {
  const errors: string[] = []

  if (!pubKey) {
    errors.push('Public key required')
  }

  // Compressed public keys are 66 chars (33 bytes hex), uncompressed are 130 chars (65 bytes hex)
  if (pubKey.length !== 66 && pubKey.length !== 130) {
    errors.push('Public key must be 66 chars (compressed) or 130 chars (uncompressed)')
  }

  if (!/^[a-f0-9]{66}$|^[a-f0-9]{130}$/i.test(pubKey)) {
    errors.push('Public key must be valid hexadecimal')
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate mnemonic phrase (BIP39)
 * Used for wallet recovery and creation (12-word format)
 */
export function validateMnemonicFormat(mnemonic: string): WalletValidationResult {
  const errors: string[] = []

  if (!mnemonic) {
    errors.push('Mnemonic phrase required')
    return { valid: false, errors }
  }

  const words = mnemonic.trim().split(/\s+/)

  if (words.length !== 12) {
    errors.push(`Mnemonic must be 12 words, got ${words.length}`)
  }

  // Check if all words are non-empty and lowercase
  words.forEach((word, index) => {
    if (!word || word.length === 0) {
      errors.push(`Word ${index + 1} is empty`)
    }
    if (!/^[a-z]+$/.test(word)) {
      errors.push(`Word ${index + 1} must be lowercase letters only: "${word}"`)
    }
  })

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate complete wallet structure
 * Comprehensive validation for all wallet components (Phase 6: blockchain-native identity)
 */
export function validateWalletComplete(options: {
  address: string
  privateKey: string
  mnemonic: string
  balance?: number
}): WalletValidationResult {
  const errors: string[] = []

  const addressCheck = validateBSVAddress(options.address)
  if (!addressCheck.valid) {
    errors.push(...(addressCheck.errors || []))
  }

  const privKeyCheck = validatePrivateKeyFormat(options.privateKey)
  if (!privKeyCheck.valid) {
    errors.push(...(privKeyCheck.errors || []))
  }

  const mnemonicCheck = validateMnemonicFormat(options.mnemonic)
  if (!mnemonicCheck.valid) {
    errors.push(...(mnemonicCheck.errors || []))
  }

  if (options.balance !== undefined) {
    const balanceCheck = validateBalance(options.balance)
    if (!balanceCheck.valid) {
      errors.push(...(balanceCheck.errors || []))
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate wallet can perform signing operations
 */
export function validateWalletCanSign(wallet: Wallet): WalletValidationResult {
  const errors: string[] = []

  const privKeyCheck = validatePrivateKeyFormat(wallet.privateKey)
  if (!privKeyCheck.valid) {
    errors.push(...(privKeyCheck.errors || []))
  }

  const mnemonicCheck = validateMnemonicFormat(wallet.mnemonic)
  if (!mnemonicCheck.valid) {
    errors.push(...(mnemonicCheck.errors || []))
  }

  const addressCheck = validateBSVAddress(wallet.publicAddress)
  if (!addressCheck.valid) {
    errors.push(...(addressCheck.errors || []))
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Validate wallet state consistency
 */
export function validateWalletStateConsistency(wallet: Wallet): WalletValidationResult {
  const errors: string[] = []

  // Creator and participant programs are optional but must be arrays if present
  if (wallet.creatorPrograms !== undefined && !Array.isArray(wallet.creatorPrograms)) {
    errors.push('Wallet.creatorPrograms must be an array')
  }

  if (wallet.participantPrograms !== undefined && !Array.isArray(wallet.participantPrograms)) {
    errors.push('Wallet.participantPrograms must be an array')
  }

  // Timestamps
  if (!wallet.createdAt) {
    errors.push('Wallet missing createdAt timestamp')
  }

  if (wallet.lastActiveAt && wallet.createdAt) {
    const createdDate = new Date(wallet.createdAt)
    const lastActiveDate = new Date(wallet.lastActiveAt)
    if (lastActiveDate < createdDate) {
      errors.push('lastActiveAt cannot be before createdAt')
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}