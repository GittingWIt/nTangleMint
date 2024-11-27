import bsv from 'bsv';

const network = bsv.Networks.testnet; // Use testnet for development
const insight = new bsv.Insight('https://api.bitindex.network');

export async function broadcastTransaction(transaction) {
  try {
    const result = await insight.broadcast(transaction);
    return result;
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
}