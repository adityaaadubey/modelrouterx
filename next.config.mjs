/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/about/data', destination: '/', permanent: false },
      { source: '/history', destination: '/', permanent: false },
      { source: '/pricing', destination: '/', permanent: false },
      { source: '/router', destination: '/', permanent: false },
      { source: '/trends', destination: '/', permanent: false },
      { source: '/intelligence', destination: '/', permanent: false },
      { source: '/benchmarks', destination: '/', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
