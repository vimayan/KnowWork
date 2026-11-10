/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/v1/* to the local Express server in dev; Render in prod
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
  transpilePackages: ['react-hot-toast'],
  images: {
    domains: ['localhost'],
  },
  // Disable external font fetching — use local font in layout.jsx
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
