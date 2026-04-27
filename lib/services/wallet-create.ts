/**
 * Wallet Creation Service
 *
 * Creates new wallets locally without requiring blockchain registration upfront.
 *
 * On-chain format (written when wallet first receives funds):
 *   nTangleMint | WALLET | v1 | {walletID} | reserved1-10
 *
 * All wallets are unified with both user and creator capabilities.
 * Wallets can be used immediately - on-chain registration happens automatically
 * when the wallet first receives funds.
 */

import type { Wallet } from "@/lib/types"
import { getAddressBalance } from "./bsv-service"
import { safeSessionStorage } from "@/lib/utils/browser"
import { NTANGLEMINT_FORMAT_VERSION } from "@/lib/constants"
import {
  deriveAddress,
  generateMnemonic,
  generateWalletID,
  getPrivKeyWif,
  saveWallet,
} from "./wallet-service"
import { invalidateWalletMetadataCache } from "./onchain-state-service"

// ============================================================================
// Wallet Creation
// ============================================================================

/**
 * Create a new wallet.
 *
 * Generates mnemonic, derives address, generates walletID, and saves to session.
 * Wallet can be used immediately without blockchain interaction.
 *
 * On-chain WALLET registration (optional):
 * - Can be broadcast anytime to record wallet metadata on-chain
 * - Only requires funds when wallet first receives a transaction
 * - Not required for wallet restoration or basic functionality
 */
export async function createWallet(
  password: string,
): Promise<{ wallet: Wallet; mnemonic: string }> {
  const mnemonic = await generateMnemonic()
  const publicAddress = deriveAddress(mnemonic, password)
  const privateKey = getPrivKeyWif(mnemonic, password)
  const walletID = generateWalletID()
  const now = new Date().toISOString()

  const balance = await getAddressBalance(publicAddress).catch(() => null)

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

  // Persist to session — credentials stay in session only, never on disk
  saveWallet(wallet)
  safeSessionStorage.setItem("ntanglemint_mnemonic_temp", mnemonic)
  safeSessionStorage.setItem("ntanglemint_password_temp", password)

  return { wallet, mnemonic }
}

// ============================================================================
// On-Chain Registration
// ============================================================================

/**
 * Broadcast the WALLET OP_RETURN record to the blockchain.
 *
 * Format: nTangleMint | WALLET | v1 | {walletID} | reserved1-10
 *
 * Reserved fields (currently empty) enable future expansion without breaking existing wallets.
 * Called automatically when wallet first receives funds, or can be called manually if needed.
 *
 * Returns the txId on success, throws on failure if wallet has no funds.
 */
export async function broadcastWalletRegistration(
  wallet: Wallet,
): Promise<string> {
  const mnemonic = safeSessionStorage.getItem("ntanglemint_mnemonic_temp")
  const password = safeSessionStorage.getItem("ntanglemint_password_temp")

  if (!mnemonic || !password) {
    throw new Error("Wallet credentials not found in session. Cannot broadcast WALLET record.")
  }

  const privKeyWif = getPrivKeyWif(mnemonic, password)

  // Lazy import to avoid circular dependency with transaction-service
  const { sendTransaction } = await import("./transaction-service")

  // Format: nTangleMint | WALLET | v1 | {walletID} | reserved1-10
  const opReturnFields = [
    "nTangleMint",
    "WALLET",
    NTANGLEMINT_FORMAT_VERSION,
    wallet.walletID,
    "", // reserved1
    "", // reserved2
    "", // reserved3
    "", // reserved4
    "", // reserved5
    "", // reserved6
    "", // reserved7
    "", // reserved8
    "", // reserved9
    "", // reserved10
  ]

  const result = await sendTransaction({
    senderPrivKeyWif: privKeyWif,
    senderAddress: wallet.publicAddress,
    outputs: [],
    opReturn: {
      data: opReturnFields,
    },
  })

  if (!result?.txId) {
    throw new Error("WALLET broadcast failed — no txId returned")
  }

  // Invalidate cache so next restoration query fetches fresh on-chain data
  invalidateWalletMetadataCache(wallet.publicAddress)

  return result.txId
}