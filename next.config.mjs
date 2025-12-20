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
  // Only rewrite paths with file extensions to avoid conflicting with page routes
  async rewrites() {
    return [
      {
        source: '/profiles/:filename(.*\\..+)',
        destination: '/api/files/profiles/:filename',
      },
      {
        source: '/events/:path*/:filename(.*\\..+)',
        destination: '/api/files/events/:path*/:filename',
      },
      {
        source: '/uploads/:filename(.*\\..+)',
        destination: '/api/files/uploads/:filename',
      },
      {
        source: '/sponsors/:filename(.*\\..+)',
        destination: '/api/files/sponsors/:filename',
      },
      {
        source: '/gallery/:filename(.*\\..+)',
        destination: '/api/files/gallery/:filename',
      },
      {
        source: '/teams/:filename(.*\\..+)',
        destination: '/api/files/teams/:filename',
      },
    ]
  },
}

export default nextConfig
