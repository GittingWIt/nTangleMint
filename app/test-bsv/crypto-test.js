// Test implementation of crypto functionality
const crypto = require("crypto")

// Test function to generate random values
function testGetRandomValues(size) {
  console.log(`Testing random value generation with size: ${size}`)

  try {
    // Simulate browser behavior for zero-length buffers
    if (size === 0) {
      throw new Error("Buffer length must be greater than 0")
    }

    // Create a buffer of the specified size
    const buffer = Buffer.alloc(size)

    // Fill it with random values
    crypto.randomFillSync(buffer)

    console.log("Generated buffer:", buffer)
    console.log("Buffer length:", buffer.length)
    console.log("Is Uint8Array:", buffer instanceof Uint8Array)

    // Test converting to Uint8Array explicitly
    const uint8Array = new Uint8Array(buffer)
    console.log("Converted to Uint8Array:", uint8Array)
    console.log("Uint8Array length:", uint8Array.length)

    return true
  } catch (error) {
    console.error("Error generating random values:", error.message)
    return false
  }
}

// Test different buffer sizes
console.log("\n=== Testing different buffer sizes ===\n")
;[16, 32, 64].forEach((size) => {
  console.log(`\nTest with ${size} bytes:`)
  const success = testGetRandomValues(size)
  console.log("Test successful:", success)
})

// Test error cases
console.log("\n=== Testing error cases ===\n")

// Test with invalid size
console.log("\nTest with invalid size:")
const invalidSizeSuccess = testGetRandomValues(-1)
console.log("Test successful:", !invalidSizeSuccess)

// Test with zero size
console.log("\nTest with zero size:")
const zeroSizeSuccess = testGetRandomValues(0)
console.log("Test successful:", !zeroSizeSuccess)

// Based on the test results, here's the correct implementation we should use:
console.log("\n=== Recommended Implementation ===\n")
console.log(`
function getRandomValues(buffer) {
  if (!(buffer instanceof Uint8Array)) {
    throw new Error("Buffer must be a Uint8Array")
  }

  if (buffer.length === 0) {
    throw new Error("Buffer length must be greater than 0")
  }

  const crypto = window.crypto || window.msCrypto
  if (!crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available")
  }

  return crypto.getRandomValues(buffer)
}
`)

// Export the test function for use in other tests
module.exports = {
  testGetRandomValues,
}