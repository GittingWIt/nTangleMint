/**
 * Type declarations for the bsv@2.0.10 library.
 * This library does not ship its own types.
 */
declare module "bsv" {
  export class Bn {
    static fromBuffer(buf: Buffer): Bn
    toBuffer(opts?: { size?: number }): Buffer
    toString(base?: number): string
  }

  export class PrivKey {
    bn: Bn
    static fromBn(bn: Bn): PrivKey
    static fromWif(wif: string): PrivKey
    static fromRandom(): PrivKey
    toWif(): string
    toBuffer(): Buffer
    toString(): string
    validate(): PrivKey
  }

  export class PubKey {
    static fromPrivKey(privKey: PrivKey): PubKey
    static fromBuffer(buf: Buffer): PubKey
    toBuffer(): Buffer
    toString(): string
  }

  export class KeyPair {
    privKey: PrivKey
    pubKey: PubKey
    static fromPrivKey(privKey: PrivKey): KeyPair
    static fromRandom(): KeyPair
  }

  export class Address {
    static fromPrivKey(privKey: PrivKey): Address
    static fromPubKey(pubKey: PubKey): Address
    static fromString(str: string): Address
    static fromPubKeyHashBuf(hashBuf: Buffer): Address
    static isValid(address: string): boolean
    toBuffer(): Buffer
    toString(): string
    hashBuf: Buffer
  }

  export class VarInt {
    static fromNumber(num: number): VarInt
    static fromBuffer(buf: Buffer): VarInt
    toBuffer(): Buffer
    toNumber(): number
  }

  export class Script {
    static fromAddress(address: Address): Script
    static fromString(str: string): Script
    static fromBuffer(buf: Buffer): Script
    static fromHex(hex: string): Script
    static fromSafeData(data: Buffer): Script
    static fromSafeDataList(dataList: Buffer[]): Script
    writeBuffer(buf: Buffer): Script
    writeOpCode(opCode: number): Script
    toBuffer(): Buffer
    toHex(): string
    toString(): string
    chunks: Array<{ buf?: Buffer; opCodeNum: number }>
  }

  export class OpCode {
    static OP_FALSE: number
    static OP_RETURN: number
    static OP_DUP: number
    static OP_HASH160: number
    static OP_EQUALVERIFY: number
    static OP_CHECKSIG: number
  }

  export class Tx {
    txIns: TxIn[]
    txOuts: TxOut[]
    nLockTime: number
    versionBytesNum: number
    static fromBuffer(buf: Buffer): Tx
    static fromHex(hex: string): Tx
    addTxIn(txIn: TxIn): Tx
    addTxOut(txOut: TxOut): Tx
    toBuffer(): Buffer
    toHex(): string
    id(): string
    hash(): Buffer
    sign(keyPair: KeyPair, sigType?: number, nIn?: number, subScript?: Script, valueBn?: Bn, flags?: number, hashCache?: any): Tx
  }

  export class TxIn {
    txHashBuf: Buffer
    txOutNum: number
    script: Script
    nSequence: number
    static fromProperties(txHashBuf: Buffer, txOutNum: number, script?: Script, nSequence?: number): TxIn
    static readonly MAX_SEQUENCE: number
    setScript(script: Script): TxIn
  }

  export class TxOut {
    valueBn: Bn
    script: Script
    constructor(valueBn?: Bn, varInt?: VarInt, script?: Script)
    static fromProperties(valueBn: Bn, script: Script): TxOut
    toBuffer(): Buffer
  }

  export class Sig {
    static SIGHASH_ALL: number
    static SIGHASH_FORKID: number
    static readonly SIGHASH_ANYONECANPAY: number
  }

  export class Hash {
    static sha256(buf: Buffer): Buffer
    static sha256Sha256(buf: Buffer): Buffer
    static ripemd160(buf: Buffer): Buffer
    static sha256Ripemd160(buf: Buffer): Buffer
  }

  export class Bip32 {
    privKey: PrivKey
    pubKey: PubKey
    chainCode: Buffer
    static fromSeed(seed: Buffer): Bip32
    static fromRandom(): Bip32
    static fromString(str: string): Bip32
    derive(path: string): Bip32
    deriveChild(index: number): Bip32
    toPublic(): Bip32
    toString(): string
    isPrivate(): boolean
  }

  export class Constants {
    static Mainnet: {
      Address: { pubKeyHash: number }
      Bip32: { pubKey: number; privKey: number }
      Block: { maxNBits: number; magicNum: number }
      Msg: { magicNum: number }
      PrivKey: { versionByteNum: number }
      TxBuilder: { feePerKbNum: number; dust: number }
    }
    static Testnet: {
      Address: { pubKeyHash: number }
      Bip32: { pubKey: number; privKey: number }
      Block: { maxNBits: number; magicNum: number }
      Msg: { magicNum: number }
      PrivKey: { versionByteNum: number }
      TxBuilder: { feePerKbNum: number; dust: number }
    }
    static Default: typeof Constants.Mainnet
  }

  export class TxBuilder {
    tx: Tx
    txIns: any[]
    txOuts: any[]
    uTxOutMap: any
    sigOperations: any
    setFeePerKbNum(feePerKbNum: number): TxBuilder
    setChangeAddress(address: Address): TxBuilder
    inputFromPubKeyHash(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, pubKey?: PubKey): TxBuilder
    outputToAddress(valueBn: Bn, address: Address): TxBuilder
    outputToScript(valueBn: Bn, script: Script): TxBuilder
    build(opts?: { useAllInputs?: boolean }): TxBuilder
    signWithKeyPairs(keyPairs: KeyPair[]): TxBuilder
  }
}