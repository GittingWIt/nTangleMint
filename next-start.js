// This file is designed to be the first module loaded by Next.js
// It applies our fixes before any other code runs

// Apply global fixes immediately
require("./lib/early-global-fix")

// Export a dummy value to ensure this module is not tree-shaken
module.exports = true