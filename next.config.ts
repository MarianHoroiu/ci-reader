import type { NextConfig } from 'next';
import {
  getGlobalSecurityHeaders,
  getServiceWorkerSecurityHeaders,
  getAPISecurityHeaders,
  getStaticAssetSecurityHeaders,
  getManifestSecurityHeaders,
  isDevelopment,
} from './lib/security-headers';
import { InjectManifest } from 'workbox-webpack-plugin';

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

  // Comprehensive PWA security headers
  async headers() {
    const isDev = isDevelopment();

    return [
      {
        // Global security headers for all routes
        source: '/(.*)',
        headers: getGlobalSecurityHeaders(isDev),
      },
      {
        // Service Worker specific security headers
        source: '/sw.js',
        headers: getServiceWorkerSecurityHeaders(),
      },
      {
        // API routes security headers
        source: '/api/:path*',
        headers: getAPISecurityHeaders(),
      },
      {
        // PWA manifest security headers
        source: '/manifest.json',
        headers: getManifestSecurityHeaders(),
      },
      {
        // Static assets security headers (Next.js static files)
        source: '/_next/static/:path*',
        headers: getStaticAssetSecurityHeaders(),
      },
      {
        // Public static assets security headers
        source: '/icons/:path*',
        headers: getStaticAssetSecurityHeaders(),
      },
      {
        // Favicon and other root static files
        source:
          '/(favicon.ico|icon.svg|apple-touch-icon.png|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 24 hours
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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

  // Webpack configuration for PWA assets and Workbox
  webpack: (config, { isServer, dev }) => {
    // Handle service worker files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };

      // Add Workbox plugin for enhanced service worker functionality
      if (!dev) {
        config.plugins.push(
          new InjectManifest({
            swSrc: './public/sw.js',
            swDest: '../public/sw.js',
            exclude: [
              /\.map$/,
              /manifest$/,
              /\.htaccess$/,
              /service-worker\.js$/,
              /sw\.js$/,
            ],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          })
        );
      }
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
