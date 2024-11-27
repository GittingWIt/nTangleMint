/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
      bodySizeLimit: "2mb"
    }
  }
}

module.exports = nextConfig