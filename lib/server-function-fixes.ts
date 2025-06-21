/**
 * Server-side fixes for "X is not a function" errors during build
 * This addresses the root cause in the Next.js build environment
 */

// Apply fixes to the global object in Node.js
export function applyServerFixes(): void {
  if (typeof global === "undefined") return

  // List of globals that might be accessed during SSR
  const commonGlobals = ["s", "i", "ga", "gtag", "fbq", "dataLayer", "analytics"]

  // Create these as no-op functions in the global scope
  commonGlobals.forEach((name) => {
    if ((global as any)[name] === undefined) {
      ;(global as any)[name] = () => null
      console.log(`Created server-side '${name}' as a no-op function`)
    }
  })
}

// Apply fixes immediately when this module is imported
applyServerFixes()