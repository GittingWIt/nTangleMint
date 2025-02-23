import type { BSVNetwork } from './types'

export const NETWORKS = {
  mainnet: {
    name: 'mainnet',
    alias: 'livenet',
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0xe3e1f3e8
  },
  testnet: {
    name: 'testnet',
    alias: 'regtest',
    pubkeyhash: 0x6f,
    privatekey: 0xef,
    scripthash: 0xc4,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0xdab5bffa
  }
} as const

export const DEFAULT_CONFIG = {
  network: NETWORKS.mainnet,
  apiEndpoint: 'https://api.bitindex.network',
  minBalance: 0.001,
  defaultFee: 0.5
} as const

export const STORAGE_KEYS = {
  WALLET_DATA: 'wallet_data',
  WALLET_TYPE: 'wallet_type'
} as const