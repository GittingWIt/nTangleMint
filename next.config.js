/** @type {import('next').NextConfig} */
const webpack = require("webpack")

const nextConfig = {
  transpilePackages: ["@testing-library/react"],
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

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      )

      // Force BSV to be resolved from node_modules
      config.resolve.alias = {
        ...config.resolve.alias,
        bsv: require.resolve("bsv"),
      }
    }

    return config
  },
}

module.exports = nextConfig