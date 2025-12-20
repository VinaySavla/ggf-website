/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Rewrite uploaded file paths to API route for dynamic serving in production
  // These folders don't have page routes, so we can safely rewrite all paths
  async rewrites() {
    return [
      {
        source: '/profiles/:path*',
        destination: '/api/files/profiles/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: '/api/files/uploads/:path*',
      },
      {
        source: '/sponsors/:path*',
        destination: '/api/files/sponsors/:path*',
      },
      {
        source: '/gallery/:path*',
        destination: '/api/files/gallery/:path*',
      },
      {
        source: '/teams/:path*',
        destination: '/api/files/teams/:path*',
      },
      {
        source: '/payments/:path*',
        destination: '/api/files/payments/:path*',
      },
      {
        source: '/players/:path*',
        destination: '/api/files/players/:path*',
      },
    ]
  },
}

export default nextConfig
