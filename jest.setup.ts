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
      digest: async (algorithm: string, data: Uint8Array) => {
        // Simple mock implementation
        return new Uint8Array(32).buffer
      },
    },
  },
})