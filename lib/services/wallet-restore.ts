/**
 * Wallet Restoration Service
 *
 * Restores a wallet from a BIP39 mnemonic by:
 *   1. Validating the mnemonic format
 *   2. Deriving the address from the mnemonic
 *   3. Querying blockchain for WALLET OP_RETURN metadata (if available)
 *   4. Falling back to generated walletID if on-chain record not found
 *   5. Reconstructing the wallet object
 *
 * Wallet restoration does NOT require on-chain metadata.
 * All users have unified wallets with both user and creator capabilities.
 */

import type { Wallet } from "@/lib/types"
import { getAddressBalance } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import {
  deriveAddress,
  validateMnemonic,
  getPrivKeyWif,
  saveWallet,
  generateWalletID,
} from "./wallet-service"

// ============================================================================
// Wallet Restoration
// ============================================================================

/**
 * Restore a wallet from a BIP39 mnemonic.
 *
 * Works with or without on-chain WALLET metadata.
 * The address is deterministically derived from the mnemonic.
 *
 * Returns a fully functional Wallet object that can be used immediately.
 */
export async function restoreWallet(
  mnemonic: string,
  password: string,
): Promise<Wallet> {
  // Validate mnemonic format
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase")
  }

  // Derive address and private key from mnemonic
  const publicAddress = deriveAddress(mnemonic, password)
  const privateKey = getPrivKeyWif(mnemonic, password)

  let walletID: string | undefined

  // Try to fetch wallet metadata from blockchain (optional enhancement)
  try {
    const { getWalletMetadataOnChain } = await import("./onchain-state-service")
    const walletMetadata = await getWalletMetadataOnChain(publicAddress)
    
    if (walletMetadata?.walletID) {
      walletID = walletMetadata.walletID
    }
  } catch (error) {
    // On-chain metadata lookup optional - wallet will restore with generated walletID
  }

  // Try to recover programs created by this wallet from blockchain
  try {
    const { getProgramsByWalletOnChain } = await import("./onchain-state-service")
    const onChainPrograms = await getProgramsByWalletOnChain(publicAddress)
    
    if (onChainPrograms.length > 0) {
      // Recover programs to local storage
      const { recoverProgramsFromChain } = await import("./program-service")
      await recoverProgramsFromChain(onChainPrograms, publicAddress)
    }
  } catch (error) {
    // Program recovery optional - wallet will still function without recovered programs
  }

  // If on-chain metadata not found, generate new walletID
  if (!walletID) {
    walletID = generateWalletID()
    console.log("[v0] Generated new walletID for restored wallet:", walletID)
  }

  const now = new Date().toISOString()

  // Fetch balance (non-blocking, defaults to zero if fetch fails)
  const balance = await getAddressBalance(publicAddress).catch(() => null)

  // Reconstruct wallet object — unified structure for all users
  const wallet: Wallet = {
    walletID,
    publicAddress,
    privateKey,
    mnemonic,
    balance: balance
      ? { address: publicAddress, ...balance }
      : { address: publicAddress, confirmed: 0, unconfirmed: 0, total: 0 },
    createdAt: now,
    lastActiveAt: now,
  }

  // Persist credentials to session (never to disk)
  safeSessionStorage.setItem("ntanglemint_mnemonic_temp", mnemonic)
  safeSessionStorage.setItem("ntanglemint_password_temp", password)
  saveWallet(wallet)

  return wallet
}