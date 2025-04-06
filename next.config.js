/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  serverRuntimeConfig: {
    downloadDir: process.env.DOWNLOAD_DIR || './downloads',
    clipsDir: process.env.CLIPS_DIR || './clips',
  },
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL || '',
  },
}

module.exports = nextConfig
