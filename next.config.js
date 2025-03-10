/** @type {import('next').NextConfig} */
const webpack = require("webpack")

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@testing-library/react"],
  images: {
    domains: ["placeholder.com"],
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

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      )

      config.resolve.alias = {
        ...config.resolve.alias,
        bsv: require.resolve("bsv"),
      }
    }

    return config
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
}

module.exports = nextConfig