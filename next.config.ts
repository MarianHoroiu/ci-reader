import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for Next.js 15
  experimental: {
    // HTTPS is handled via command-line flags in Next.js 15:
    // --experimental-https (auto-generates certificates with mkcert)
    // --experimental-https-key and --experimental-https-cert (custom certificates)
    // Future experimental features can be added here
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by separate script
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Linting is handled by separate script
    ignoreDuringBuilds: false,
  },

  // Turbopack is enabled via --turbo flag in package.json scripts

  // PWA and security headers preparation
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        // Cache control for API routes (explicit caching for Next.js 15)
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration for PWA assets
  webpack: (config, { isServer }) => {
    // Handle service worker files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // Output configuration for static export capability
  output: 'standalone',

  // Compression for better performance
  compress: true,

  // Power by header removal for security
  poweredByHeader: false,
};

export default nextConfig;
