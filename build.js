const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Log the current directory and files
console.log("Current directory:", process.cwd())
console.log("Files in node_modules/.bin:", fs.readdirSync(path.join(process.cwd(), "node_modules", ".bin")).join(", "))

try {
  // Fix permissions for the next binary
  console.log("Fixing permissions for next binary...")
  execSync("chmod +x ./node_modules/.bin/next", { stdio: "inherit" })
  console.log("Permissions fixed successfully")

  // Run the build command
  console.log("Running next build...")
  execSync("npx next build", { stdio: "inherit" })
  console.log("Build completed successfully")
} catch (error) {
  console.error("Build script error:", error)
  process.exit(1)
}