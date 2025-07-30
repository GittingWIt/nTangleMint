//! A foundation for building applications on Bitcoin SV using Rust.
//! 
//! This library provides comprehensive BSV functionality including:
//! - Wallet generation and management
//! - Transaction creation and signing
//! - Script execution and validation
//! - OP_RETURN data embedding
//! - Full P2P networking (native only)

extern crate byteorder;
#[cfg(not(target_arch = "wasm32"))]
extern crate dns_lookup;
extern crate hex;
#[macro_use]
extern crate log;
extern crate linked_hash_map;
extern crate murmur3;
extern crate rand;
extern crate ring;
extern crate snowflake;
extern crate base58;
extern crate num_bigint;
extern crate num_traits;
extern crate num_integer;
extern crate ripemd;

// Crypto backend selection - secp256k1 for native, k256 for WASM
#[cfg(not(target_arch = "wasm32"))]
extern crate secp256k1;
#[cfg(target_arch = "wasm32")]
extern crate k256;

// All modules available everywhere
pub mod address;
pub mod messages;
pub mod network;
pub mod script;
pub mod transaction;
pub mod util;
pub mod wallet;

// Native-only modules (P2P networking, etc.)
#[cfg(not(target_arch = "wasm32"))]
pub mod peer;

// Native crypto exports (secp256k1 - full performance)
#[cfg(not(target_arch = "wasm32"))]
pub use secp256k1::{
    SecretKey, PublicKey, Message, 
    ecdsa::{Signature, SerializedSignature},
    Secp256k1, All,
};

// WASM crypto exports (k256 - WASM compatible)
#[cfg(target_arch = "wasm32")]
pub use k256::{
    SecretKey, PublicKey,
    ecdsa::{Signature, SigningKey, VerifyingKey},
};

// WASM-specific exports
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn test_build() -> String {
    "BSV Core v79 - Native: secp256k1, WASM: k256 - Full BSV functionality enabled!".to_string()
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn get_crypto_backend() -> String {
    "k256 (WASM-optimized)".to_string()
}

#[cfg(not(target_arch = "wasm32"))]
pub fn get_crypto_backend() -> String {
    "secp256k1 (native performance)".to_string()
}

// Feature detection
pub fn has_full_scripting() -> bool {
    true // Both backends support full script execution
}

pub fn has_op_return() -> bool {
    true // OP_RETURN data embedding supported
}

pub fn has_transactions() -> bool {
    true // Full transaction creation and signing
}

#[cfg(not(target_arch = "wasm32"))]
pub fn has_p2p_networking() -> bool {
    true // P2P networking only on native
}

#[cfg(target_arch = "wasm32")]
pub fn has_p2p_networking() -> bool {
    false // No P2P networking in WASM
}