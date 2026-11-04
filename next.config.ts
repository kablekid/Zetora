import type { NextConfig } from 'next';

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: supabaseHost.protocol.replace(':', '') as 'http' | 'https',
            hostname: supabaseHost.hostname,
            port: supabaseHost.port,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
    // Local development against http://localhost Supabase
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production' || process.env.ZETORA_ALLOW_LOCAL_IMAGES === '1',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
