declare module 'bsv' {
    export class PrivateKey {
      static fromRandom(): PrivateKey;
      static fromString(str: string): PrivateKey;
      toString(): string;
      toAddress(): Address;
      toPublicKey(): PublicKey;
    }
  
    export class PublicKey {
      toString(): string;
    }
  
    export class Address {
      static isValid(address: string): boolean;
      toString(): string;
    }
  }
