use std::fmt;
use std::error::Error as StdError;
use ring::error::Unspecified as RingUnspecifiedError;
use hex::FromHexError;
use base58::FromBase58Error;
use std::string::FromUtf8Error;

// Import crypto errors based on target
#[cfg(not(target_arch = "wasm32"))]
use secp256k1::Error as Secp256k1Error;
#[cfg(target_arch = "wasm32")]
use k256::ecdsa::Error as K256Error;

#[derive(Debug)]
pub enum Error {
    BadData(String),
    BadArgument(String),
    SpvBadProofFormat,
    SpvBadMerkleProof,
    SpvDuplicateTransaction,
    SpvUnknownTransaction,
    Timeout,
    Io(std::io::Error),
    Ring(RingUnspecifiedError),
    Hex(FromHexError),
    FromBase58Error(FromBase58Error),
    FromUtf8Error(FromUtf8Error),
    IOError(std::io::Error),
    InvalidOperation(String),
    IllegalState(String),
    ScriptError(String),
    // Crypto errors - target specific
    #[cfg(not(target_arch = "wasm32"))]
    Secp256k1Error(Secp256k1Error),
    #[cfg(target_arch = "wasm32")]
    K256Error(K256Error),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            Error::BadData(ref s) => write!(f, "Bad data: {}", s),
            Error::BadArgument(ref s) => write!(f, "Bad argument: {}", s),
            Error::SpvBadProofFormat => write!(f, "Bad proof format"),
            Error::SpvBadMerkleProof => write!(f, "Bad merkle proof"),
            Error::SpvDuplicateTransaction => write!(f, "Duplicate transaction"),
            Error::SpvUnknownTransaction => write!(f, "Unknown transaction"),
            Error::Timeout => write!(f, "Timeout"),
            Error::Io(ref e) => write!(f, "IO error: {}", e),
            Error::Ring(ref e) => write!(f, "Ring error: {:?}", e),
            Error::Hex(ref e) => write!(f, "Hex error: {}", e),
            Error::FromBase58Error(ref e) => write!(f, "Base58 error: {:?}", e), // Fixed: use {:?}
            Error::FromUtf8Error(ref e) => write!(f, "UTF8 error: {}", e),
            Error::IOError(ref e) => write!(f, "IO error: {}", e),
            Error::InvalidOperation(ref s) => write!(f, "Invalid operation: {}", s),
            Error::IllegalState(ref s) => write!(f, "Illegal state: {}", s),
            Error::ScriptError(ref s) => write!(f, "Script error: {}", s),
            #[cfg(not(target_arch = "wasm32"))]
            Error::Secp256k1Error(ref e) => write!(f, "Secp256k1 error: {}", e),
            #[cfg(target_arch = "wasm32")]
            Error::K256Error(ref e) => write!(f, "K256 error: {}", e),
        }
    }
}

impl StdError for Error {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        match *self {
            Error::Io(ref e) => Some(e),
            Error::Hex(ref e) => Some(e),
            Error::FromUtf8Error(ref e) => Some(e),
            Error::IOError(ref e) => Some(e),
            #[cfg(not(target_arch = "wasm32"))]
            Error::Secp256k1Error(ref e) => Some(e),
            #[cfg(target_arch = "wasm32")]
            Error::K256Error(ref e) => Some(e),
            _ => None,
        }
    }
}

// All the From implementations
impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Error {
        Error::Io(e)
    }
}

impl From<RingUnspecifiedError> for Error {
    fn from(e: RingUnspecifiedError) -> Error {
        Error::Ring(e)
    }
}

impl From<FromHexError> for Error {
    fn from(e: FromHexError) -> Error {
        Error::Hex(e)
    }
}

impl From<FromBase58Error> for Error {
    fn from(e: FromBase58Error) -> Error {
        Error::FromBase58Error(e)
    }
}

impl From<FromUtf8Error> for Error {
    fn from(e: FromUtf8Error) -> Error {
        Error::FromUtf8Error(e)
    }
}

// Target-specific crypto error conversions
#[cfg(not(target_arch = "wasm32"))]
impl From<Secp256k1Error> for Error {
    fn from(e: Secp256k1Error) -> Error {
        Error::Secp256k1Error(e)
    }
}

#[cfg(target_arch = "wasm32")]
impl From<K256Error> for Error {
    fn from(e: K256Error) -> Error {
        Error::K256Error(e)
    }
}

pub type Result<T> = std::result::Result<T, Error>;