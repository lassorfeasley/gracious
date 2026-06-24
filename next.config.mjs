/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      // The guest visits page was renamed /my-trips → /my-visits. Keep the old
      // path working for any links already sent out by email.
      { source: '/my-trips', destination: '/my-visits', permanent: true },
    ];
  },
};

export default nextConfig;
