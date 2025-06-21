# Build Fix Scripts

This directory contains scripts used to fix issues in the Next.js build output.

## Current Scripts

- `fix-build-output.js` - Comprehensive script that fixes all known issues in the build output
  - Fixes "s is not a function" errors
  - Fixes "initProgramCreationHooks is not a function" errors  
  - Fixes "o is not a function" errors
  - Fixes public page export issues

## Usage

The `fix-build-output.js` script is automatically run after the build process completes via the `postbuild` script in package.json.

If you need to run it manually:

\`\`\`bash
node scripts/fix-build-output.js
\`\`\`

## Notes

Most debugging and localStorage-related scripts have been removed as the application has moved to BSV SDK and removed localStorage dependencies.