import "@testing-library/jest-dom"

// Mock window.crypto for tests
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256)
      }
      return buffer
    },
    subtle: {
      digest: async (_algorithm: string, data: Uint8Array) => {
        // Simple mock implementation that uses the input data
        // to create a deterministic hash-like output
        const result = new Uint8Array(32)
        if (data && data.length > 0) {
          for (let i = 0; i < result.length; i++) {
            // Safe access to data with fallback
            const dataValue = data[i % data.length] || 0
            result[i] = dataValue ^ (i * 13) // Simple XOR operation for testing
          }
        } else {
          // Fill with deterministic values if no input data
          for (let i = 0; i < result.length; i++) {
            result[i] = i * 13
          }
        }
        return result.buffer
      },
      // Add other required SubtleCrypto methods with proper type checking
      encrypt: async () => new ArrayBuffer(32),
      decrypt: async () => new ArrayBuffer(32),
      sign: async () => new ArrayBuffer(32),
      verify: async () => true,
      generateKey: async () => ({
        privateKey: new ArrayBuffer(32),
        publicKey: new ArrayBuffer(32),
      }),
      deriveKey: async () => new ArrayBuffer(32),
      deriveBits: async () => new ArrayBuffer(32),
      importKey: async () => new ArrayBuffer(32),
      exportKey: async () => new ArrayBuffer(32),
      wrapKey: async () => new ArrayBuffer(32),
      unwrapKey: async () => new ArrayBuffer(32),
    },
  },
})

// Mock other browser APIs if needed
Object.defineProperty(window, "TextEncoder", {
  value: class TextEncoder {
    encode(str: string): Uint8Array {
      const arr = new Uint8Array(str.length)
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i)
      }
      return arr
    }
  },
})

Object.defineProperty(window, "TextDecoder", {
  value: class TextDecoder {
    decode(arr: Uint8Array): string {
      return String.fromCharCode.apply(null, Array.from(arr))
    }
  },
})