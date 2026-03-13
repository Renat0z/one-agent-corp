/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow streaming from parent process
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001']
    }
  }
};

module.exports = nextConfig;
