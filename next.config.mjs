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
  async rewrites() {
    return [
      {
        source: '/profiles/:path*',
        destination: '/api/files/profiles/:path*',
      },
      {
        source: '/events/:path*',
        destination: '/api/files/events/:path*',
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
    ]
  },
}

export default nextConfig
