/**
 * This file contains fixes for common Next.js build issues
 * It's imported in app/layout.tsx to ensure it runs early in the build process
 */

// Fix for "s is not a function" error
if (typeof global !== "undefined") {
  if (typeof (global as any).s !== "function") {
    ;(global as any).s = () => null
    console.log("Added global.s function")
  }
}

// Fix for "i is not a function" error
if (typeof global !== "undefined") {
  if (typeof (global as any).i !== "function") {
    ;(global as any).i = () => null
    console.log("Added global.i function")
  }
}

// Fix for other common "X is not a function" errors
const commonGlobals = ["ga", "gtag", "dataLayer", "fbq", "ttq", "rdt", "snaptr"]
if (typeof global !== "undefined") {
  commonGlobals.forEach((name) => {
    if (typeof (global as any)[name] === "undefined") {
      ;(global as any)[name] = () => null
      console.log(`Added global.${name} function`)
    }
  })
}

export {}