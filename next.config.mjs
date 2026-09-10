const approvedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: approvedImageHosts.map((hostname) => ({ protocol: 'https', hostname })),
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
    ]
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'" },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }]
  },
}

export default nextConfig
