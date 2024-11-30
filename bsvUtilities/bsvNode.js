import * as bsv from 'bsv';

// Initialize the network configuration
const network = {
  name: 'testnet',
  alias: 'regtest',
  pubkeyhash: 0x6f,
  privatekey: 0xef,
  scripthash: 0xc4,
  xpubkey: 0x043587cf,
  xprivkey: 0x04358394,
  networkMagic: 0xdab5bffa
};

// Configure the API endpoint
const apiEndpoint = 'https://api.bitindex.network';

export async function broadcastTransaction(transaction) {
  try {
    // Create a new instance for each transaction
    const insight = new bsv.Insight(apiEndpoint);
    const result = await insight.broadcast(transaction);
    return result;
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
}

// Export the network configuration for use in other files
export const testnet = network;