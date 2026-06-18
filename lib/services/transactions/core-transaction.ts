/**
 * Core Transaction Service
 *
 * Builds, signs, and broadcasts BSV transactions using the @bsv/sdk library.
 * This is the foundation for all transaction operations.
 */

import { PrivateKey, P2PKH, Transaction, Script } from "@bsv/sdk"
import { getUTXOs, broadcastTransaction } from "../bsv-service"
import type { UTXOData } from "../bsv-service"

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
 * Calculate the approximate size of a transaction in bytes
 * This accounts for: inputs, outputs, OP_RETURN data, and Bitcoin script overhead
 */
function estimateTransactionSize(
  inputCount: number,
  outputCount: number,
  opReturnDataSize: number = 0
): number {
  let size = 0

  // Version (4 bytes) + Locktime (4 bytes)
  size += 8

  // Input count varint (1-3 bytes, typically 1 for < 253 inputs)
  size += 1

  // Per input: outpoint (32 + 4) + sequence (4) + script length varint (1) + scriptSig (~107 bytes for P2PKH sig+pubkey)
  // P2PKH scriptSig: signature (71-72 bytes DER) + pubkey (33 bytes) + opcodes (~2 bytes)
  size += inputCount * (32 + 4 + 1 + 107 + 4)

  // Output count varint (1-3 bytes, typically 1)
  size += 1

  // Per output: satoshis (8 bytes) + script length varint (1 byte) + script
  // P2PKH lockScript: 25 bytes
  // OP_RETURN lockScript: ~1 byte opcode + 1 byte length varint + data
  size += outputCount * (8 + 1 + 25) // Assumes P2PKH outputs

  // If there's OP_RETURN data, calculate its actual script size
  if (opReturnDataSize > 0) {
    // OP_RETURN script: 0x6a (1) + length varint (1-3) + data
    const lengthVarintSize = opReturnDataSize <= 75 ? 1 : 2 // Direct push vs OP_PUSHDATA1
    size += 1 + lengthVarintSize + opReturnDataSize
  }

  return size
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
      // Join all data items with pipe delimiters as per nTangleMint protocol
      const combinedData = opReturn.data.join("|")
      const dataBuffer = Buffer.from(combinedData, "utf8")

      // Create OP_RETURN script manually: OP_RETURN (0x6a) + push data opcode + data
      const scriptHex = "6a" + // OP_RETURN opcode
        (dataBuffer.length <= 75 
          ? dataBuffer.length.toString(16).padStart(2, "0") // Direct push for small data
          : "4c" + dataBuffer.length.toString(16).padStart(2, "0") // OP_PUSHDATA1 for larger data
        ) +
        dataBuffer.toString("hex")

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

    // 11. Calculate dynamic transaction size based on actual inputs/outputs/data
    const opReturnDataSize = opReturn?.data.reduce((sum, item) => sum + Buffer.byteLength(item, 'utf8'), 0) || 0
    const outputCountWithChange = txOutputs.length + 1 // +1 for change output that will be added
    const estimatedTxSize = estimateTransactionSize(sortedUtxos.length, outputCountWithChange, opReturnDataSize)
    const estimatedFeeRate = 1 // satoshis per byte
    const estimatedFees = estimatedTxSize * estimatedFeeRate
    
    console.log(`[v0] ESTIMATION PHASE:`)
    console.log(`[v0]   Inputs count: ${sortedUtxos.length}`)
    console.log(`[v0]   Outputs count (before change): ${txOutputs.length}`)
    console.log(`[v0]   OP_RETURN data size: ${opReturnDataSize} bytes`)
    console.log(`[v0]   Estimated fee rate: ${estimatedFeeRate} sat/byte`)
    console.log(`[v0]   Estimated tx size: ${estimatedTxSize} bytes (dynamically calculated)`)
    console.log(`[v0]   Estimated fees: ${estimatedFees} satoshis`)

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
    
    console.log(`[v0] SIGNING COMPLETE - ANALYZING ACTUAL TRANSACTION:`)
    console.log(`[v0]   Transaction hex length: ${txHex.length} characters`)
    console.log(`[v0]   Actual signed transaction size: ${actualTxSize} bytes`)
    console.log(`[v0]   Expected fees at 1 sat/byte: ${actualFees} satoshis`)
    console.log(`[v0]   Our estimate was: ${estimatedTxSize} bytes (${estimatedFees} satoshis)`)
    console.log(`[v0]   Difference: ${actualTxSize - estimatedTxSize} bytes (${actualFees - estimatedFees} satoshis)`)

    // 16. If we over-estimated, the extra satoshis are already in change (which is correct)
    // If we under-estimated, we have a problem and should have used larger estimate
    const feeOverage = estimatedFees - actualFees
    if (Math.abs(feeOverage) > 0) {
      if (feeOverage > 0) {
        console.log(`[v0] ✓ GOOD: We overestimated by ${feeOverage} satoshis - change includes safety margin`)
      } else {
        console.log(`[v0] ⚠ WARNING: We underestimated by ${Math.abs(feeOverage)} satoshis - next tx may fail if pattern repeats`)
      }
    } else {
      console.log(`[v0] ✓ PERFECT: Fee estimate matches actual`)
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