import "@testing-library/jest-dom"
import "jest-environment-jsdom"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "",
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_TEST_MODE: "true",
  NEXT_PUBLIC_REACT_VERSION: "19.0.0",
  NEXT_PUBLIC_NEXT_VERSION: "15.0.0",
  NEXT_PUBLIC_RADIX_DROPDOWN_VERSION: "2.0.6",
  NEXT_PUBLIC_RADIX_SLOT_VERSION: "1.0.2",
}

// Mock Radix UI Portal for testing - using a much simpler approach
jest.mock("@radix-ui/react-dropdown-menu", () => {
  const actual = jest.requireActual("@radix-ui/react-dropdown-menu");
  // Create a simple object that mimics the structure but avoids JSX
  return {
    ...actual,
    Portal: function(props: any) {
      return props.children;
    }
  };
});

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver with proper typing
global.IntersectionObserver = class MockIntersectionObserver {
  root: Element | null = null;
  rootMargin: string = "0px";
  thresholds: ReadonlyArray<number> = [0];
  
  // Use the callback parameter to avoid the unused variable warning
  constructor(callback: IntersectionObserverCallback) {
    // Store callback in a private field to avoid the unused variable warning
    Object.defineProperty(this, '_callback', {
      value: callback,
      writable: false,
      enumerable: false
    });
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
};

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