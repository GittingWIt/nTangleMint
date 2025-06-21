/**
 * Global function definitions to prevent "X is not a function" errors
 * This ensures these functions are available during compilation and runtime
 */

// Define safe fallback functions
const safeFallback = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Safe fallback function called')
  }
  return undefined
}

// Initialize global functions immediately
if (typeof globalThis !== 'undefined') {
  if (!globalThis.s) {
    globalThis.s = safeFallback
  }
  if (!globalThis.o) {
    globalThis.o = safeFallback
  }
  if (!globalThis.initProgramCreationHooks) {
    globalThis.initProgramCreationHooks = safeFallback
  }
}

// Browser environment
if (typeof window !== 'undefined') {
  if (!window.s) {
    window.s = safeFallback
  }
  if (!window.o) {
    window.o = safeFallback
  }
  if (!window.initProgramCreationHooks) {
    window.initProgramCreationHooks = safeFallback
  }
}

// Node.js environment
if (typeof global !== 'undefined') {
  if (!(global as any).s) {
    (global as any).s = safeFallback
  }
  if (!(global as any).o) {
    (global as any).o = safeFallback
  }
  if (!(global as any).initProgramCreationHooks) {
    (global as any).initProgramCreationHooks = safeFallback
  }
}

// Export for explicit imports
export const s = safeFallback
export const o = safeFallback
export const initProgramCreationHooks = safeFallback

// Ensure functions are available at module load time
export function ensureGlobalFunctions() {
  // This function can be called to ensure all globals are set
  return {
    s: globalThis.s || safeFallback,
    o: globalThis.o || safeFallback,
    initProgramCreationHooks: globalThis.initProgramCreationHooks || safeFallback
  }
}