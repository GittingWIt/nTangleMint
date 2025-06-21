/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Still ignore ESLint during builds for now
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Enable TypeScript validation during builds
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  experimental: {
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        path: require.resolve("path-browserify"),
        util: require.resolve("util/"),
      }

      const webpack = require("webpack")
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      )
    }
    return config
  },
}

module.exports = nextConfig