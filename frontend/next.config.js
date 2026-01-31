/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/web/:path*',
        destination: 'http://web-traversal:5000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
