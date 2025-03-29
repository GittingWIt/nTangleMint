/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  // Disable experimental features that might cause issues
  experimental: {
    // Only keep essential experimental features
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  // Ensure environment variables are properly set
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
}

// Try to import user config if it exists
let userConfig = undefined;
try {
  const { default: importedConfig } = await import('./v0-user-next.config.js');
  userConfig = importedConfig;
} catch (e) {
  // ignore error if file doesn't exist
}

// Merge user config if available
if (userConfig) {
  for (const key in userConfig) {
    if (typeof nextConfig[key] === 'object' && !Array.isArray(nextConfig[key])) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;