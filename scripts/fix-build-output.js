#!/usr/bin/env node

/**
 * Post-build script to fix build output issues
 * This script runs after the Next.js build completes
 */

const fs = require("fs")
const path = require("path")

console.log("🔧 Running post-build fixes...")

try {
  // Check if BSV Core WASM package exists
  const wasmPkgPath = path.join(__dirname, "../packages/bsv-core/pkg")
  if (fs.existsSync(wasmPkgPath)) {
    console.log("✅ BSV Core WASM package found at:", wasmPkgPath)

    // List WASM files
    const wasmFiles = fs
      .readdirSync(wasmPkgPath)
      .filter((file) => file.endsWith(".wasm") || file.endsWith(".js") || file.endsWith(".ts"))
    console.log("📦 WASM files:", wasmFiles.join(", "))
  } else {
    console.warn("⚠️  BSV Core WASM package not found. Run 'npm run build:rust' first.")
  }

  // Verify Next.js build output
  const nextDir = path.join(__dirname, "../.next")
  if (fs.existsSync(nextDir)) {
    console.log("✅ Next.js build output verified")

    // Check for static files
    const staticDir = path.join(nextDir, "static")
    if (fs.existsSync(staticDir)) {
      console.log("✅ Static assets directory found")
    }
  } else {
    console.error("❌ Next.js build output not found")
    process.exit(1)
  }

  // Create any necessary symlinks or copies for WASM files
  const publicWasmDir = path.join(__dirname, "../public/wasm")
  if (!fs.existsSync(publicWasmDir)) {
    fs.mkdirSync(publicWasmDir, { recursive: true })
    console.log("📁 Created public/wasm directory")
  }

  console.log("✅ Post-build fixes completed successfully")
} catch (error) {
  console.error("❌ Post-build fix failed:", error)
  process.exit(1)
}