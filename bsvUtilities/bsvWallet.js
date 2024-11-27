import bsv from 'bsv';

export function createNewWallet() {
  const privateKey = bsv.PrivateKey.fromRandom();
  const address = privateKey.toAddress();
  const mnemonic = bsv.Mnemonic.fromRandom();
  
  return {
    address: address.toString(),
    privateKey: privateKey.toString(),
    mnemonic: mnemonic.phrase
  };
}

export function restoreWallet(mnemonicPhrase) {
  const mnemonic = bsv.Mnemonic.fromString(mnemonicPhrase);
  const hdPrivateKey = bsv.HDPrivateKey.fromSeed(mnemonic.toSeed());
  const privateKey = hdPrivateKey.privateKey;
  const address = privateKey.toAddress();
  
  return {
    address: address.toString(),
    privateKey: privateKey.toString(),
    mnemonic: mnemonicPhrase
  };
}