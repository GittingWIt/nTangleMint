/**
 * Transaction Service
 *
 * Builds, signs, and broadcasts BSV transactions using the @bsv/sdk library.
 * This is the single source of truth for all transaction operations.
 */

import { PrivateKey, P2PKH, Transaction, Script } from "@bsv/sdk"
import { getUTXOs, broadcastTransaction } from "./bsv-service"
import type { UTXOData } from "./bsv-service"

export interface TransactionOutput {
  address: string
  satoshis: number
}

export interface OpReturnData {
  data: string[]
}

export interface SendTransactionParams {
  senderPrivKeyWif: string
  senderAddress: string
  outputs: TransactionOutput[]
  opReturn?: OpReturnData
}

export interface SendTransactionResult {
  txId: string
  txHex: string
  fee: number
}

/**
 * Build, sign, and broadcast a BSV transaction using @bsv/sdk
 */
export async function sendTransaction(params: SendTransactionParams): Promise<SendTransactionResult> {
  const { senderPrivKeyWif, senderAddress, outputs, opReturn } = params

  try {
    // 1. Derive private key from WIF
    const privateKey = PrivateKey.fromWif(senderPrivKeyWif)
    const publicKey = privateKey.toPublicKey()

    // 2. Fetch UTXOs
    const utxos = await getUTXOs(senderAddress)
    if (!utxos || utxos.length === 0) {
      throw new Error("No UTXOs available. Wallet has no funds.")
    }

    // 3. Verify all UTXOs have source transactions
    const validUtxos = utxos.filter(utxo => utxo.sourceTransaction)
    if (validUtxos.length === 0) {
      throw new Error("Could not fetch source transactions for any UTXOs")
    }

    // 4. Sort UTXOs largest first to minimize number of inputs needed
    const sortedUtxos = [...validUtxos].sort((a, b) => b.satoshis - a.satoshis)

    // 5. Build inputs array for Transaction constructor
    const inputs = sortedUtxos.map(utxo => {
      if (!utxo.sourceTransaction) {
        throw new Error(`UTXO ${utxo.txId} missing source transaction`)
      }
      return {
        sourceTransaction: Transaction.fromHex(utxo.sourceTransaction),
        sourceOutputIndex: utxo.outputIndex,
        sequence: 0xffffffff, // Standard sequence number for final transaction
        unlockingScriptTemplate: new P2PKH().unlock(privateKey),
      }
    })

    // 6. Build outputs array
    const txOutputs = outputs.map(output => ({
      lockingScript: new P2PKH().lock(output.address),
      satoshis: output.satoshis,
    }))

    // 7. Add OP_RETURN output if present
    if (opReturn && opReturn.data.length > 0) {
      // Concatenate all data items with null byte separators
      const dataBuffers = opReturn.data.map(item => Buffer.from(item, "utf8"))
      const combinedBuffer = Buffer.concat(
        dataBuffers.map((buf, index) => {
          if (index === 0) return buf
          return Buffer.concat([Buffer.from([0x00]), buf])
        })
      )

      // Create OP_RETURN script manually: OP_RETURN (0x6a) + push data opcode + data
      const scriptHex = "6a" + // OP_RETURN opcode
        (combinedBuffer.length <= 75 
          ? combinedBuffer.length.toString(16).padStart(2, "0") // Direct push for small data
          : "4c" + combinedBuffer.length.toString(16).padStart(2, "0") // OP_PUSHDATA1 for larger data
        ) +
        combinedBuffer.toString("hex")

      const opReturnScript = Script.fromHex(scriptHex)

      txOutputs.push({
        lockingScript: opReturnScript,
        satoshis: 0,
      })
    }

    // 8. Calculate total output satoshis (excluding change which will be calculated)
    let totalOutputSatoshis = 0
    for (const output of txOutputs) {
      totalOutputSatoshis += output.satoshis
    }

    // 9. Get total input satoshis
    let totalInputSatoshis = 0
    for (const utxo of sortedUtxos) {
      totalInputSatoshis += utxo.satoshis
    }

    // 10. Create transaction with specified outputs
    const tx = new Transaction(1, inputs, txOutputs)

    // 11. Estimate fees conservatively (standard: ~1 satoshi per byte, tx typically 250-350 bytes)
    const estimatedFeeRate = 1 // satoshis per byte
    const estimatedTxSize = 300 // conservative estimate for signed transaction
    const estimatedFees = estimatedTxSize * estimatedFeeRate
    
    console.log(`[v0] Estimated fees: ${estimatedFees} satoshis (assuming ${estimatedTxSize} bytes)`)

    // 12. Calculate change that should go back to sender
    const changeSatoshis = totalInputSatoshis - totalOutputSatoshis - estimatedFees
    console.log(`[v0] Transaction breakdown: inputs=${totalInputSatoshis}, outputs=${totalOutputSatoshis}, fees=${estimatedFees}, change=${changeSatoshis}`)

    if (changeSatoshis < 0) {
      throw new Error(`Insufficient funds. Inputs: ${totalInputSatoshis}, Outputs + Fees: ${totalOutputSatoshis + estimatedFees}`)
    }

    // 13. Add change output if there's any change
    if (changeSatoshis > 0) {
      tx.addOutput({
        lockingScript: new P2PKH().lock(senderAddress),
        satoshis: changeSatoshis,
      })
      console.log(`[v0] Added change output: ${changeSatoshis} satoshis to ${senderAddress}`)
    }

    // 14. Sign all inputs
    console.log(`[v0] Signing transaction...`)
    await tx.sign()

    // 15. Calculate ACTUAL fees based on signed transaction size
    const txHex = tx.toHex()
    const actualTxSize = txHex.length / 2 // Convert hex string length to bytes
    const actualFees = Math.ceil(actualTxSize * estimatedFeeRate)
    
    console.log(`[v0] Actual signed transaction size: ${actualTxSize} bytes`)
    console.log(`[v0] Actual fees needed: ${actualFees} satoshis`)

    // 16. If we over-estimated, the extra satoshis are already in change (which is correct)
    // If we under-estimated, we have a problem and should have used larger estimate
    const feeOverage = estimatedFees - actualFees
    if (feeOverage !== 0) {
      console.log(`[v0] Fee estimate difference: ${feeOverage > 0 ? '+' : ''}${feeOverage} satoshis (${feeOverage > 0 ? 'overestimate' : 'underestimate'})`)
    }

    // 17. Serialize and broadcast
    const txId = tx.id()

    console.log("[TxService] Signed transaction, broadcasting...")
    const broadcastedTxId = await broadcastTransaction(txHex)

    // Return the broadcasted txId which is the authoritative confirmation
    return {
      txId: broadcastedTxId,
      txHex,
      fee: actualFees, // Actual fee based on signed transaction size
    }
  } catch (error) {
    console.error("[TxService] Error during transaction processing:", error)
    throw error
  }
}

/**
 * Validate a BSV address
 */
export function validateAddress(address: string): boolean {
  try {
    // Basic address validation - BSV addresses are 26-35 chars
    if (typeof address !== "string") return false
    if (address.length < 26 || address.length > 35) return false
    // Valid addresses start with '1' for mainnet or 'm'/'n' for testnet
    if (!["1", "m", "n"].includes(address[0])) return false
    return true
  } catch {
    return false
  }
}