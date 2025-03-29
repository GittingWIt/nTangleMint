const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ensure NEXT_TELEMETRY_DISABLED is set
process.env.NEXT_TELEMETRY_DISABLED = "1";

console.log("Current directory:", process.cwd());

// Skip permission fixing if not on Linux/Unix
const isUnix = process.platform !== 'win32';
if (isUnix) {
  try {
    console.log("Fixing permissions for next binary...");
    execSync("chmod +x ./node_modules/.bin/next", { stdio: "inherit" });
    console.log("Permissions fixed successfully");
  } catch (error) {
    console.warn("Could not fix permissions, but continuing build:", error.message);
    // Continue with build even if permission fixing fails
  }
}

// Run next build with proper environment variables
console.log("Running next build...");
try {
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_OPTIONS: "--max_old_space_size=4096",
    },
  });
  console.log("Build completed successfully");
} catch (error) {
  console.error("Build script error:", error);
  process.exit(1);
}