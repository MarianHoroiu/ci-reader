/**
 * Security Headers Configuration for Romanian ID Processing PWA
 * Implements comprehensive security headers for PWA compliance and security audits
 */

export interface SecurityHeaderConfig {
  key: string;
  value: string;
}

export interface SecurityHeadersConfig {
  global: SecurityHeaderConfig[];
  serviceWorker: SecurityHeaderConfig[];
  api: SecurityHeaderConfig[];
  static: SecurityHeaderConfig[];
}

/**
 * Content Security Policy configuration for PWA
 * Allows service workers, PWA features, and secure inline scripts
 */
export function generateCSP(isDev: boolean = false, nonce?: string): string {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Allow service worker registration
      "'unsafe-inline'", // Required for Next.js inline scripts
      // Add nonce if provided
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      // Development specific
      ...(isDev
        ? [
            "'unsafe-eval'", // Required for Next.js development
            'https://vercel.live', // Vercel preview comments
          ]
        : []),
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:', // For base64 encoded fonts
    ],
    'img-src': [
      "'self'",
      'data:', // For base64 images and PWA icons
      'blob:', // For generated images
      'https:', // For external images
    ],
    'media-src': ["'self'", 'data:', 'blob:'],
    'connect-src': [
      "'self'",
      // WebSocket connections for development
      ...(isDev
        ? ['ws://localhost:*', 'wss://localhost:*', 'https://vercel.live']
        : []),
    ],
    'worker-src': [
      "'self'",
      'blob:', // For service worker
    ],
    'child-src': ["'self'", 'blob:'],
    'frame-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(baseCSP)
    .map(([directive, sources]) =>
      sources.length > 0 ? `${directive} ${sources.join(' ')}` : directive
    )
    .join('; ');
}

/**
 * Security headers for all routes
 */
export function getGlobalSecurityHeaders(
  isDev: boolean = false
): SecurityHeaderConfig[] {
  return [
    // Content Security Policy
    {
      key: 'Content-Security-Policy',
      value: generateCSP(isDev),
    },
    // Prevent clickjacking
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    // XSS Protection
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    // Referrer Policy
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    // DNS Prefetch Control
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    // Permissions Policy (Feature Policy)
    {
      key: 'Permissions-Policy',
      value: [
        'camera=self',
        'microphone=self',
        'geolocation=self',
        'notifications=self',
        'push=self',
        'sync-xhr=self',
        'usb=self',
        'web-share=self',
        'payment=self',
      ].join(', '),
    },
    // HTTPS enforcement (only in production)
    ...(isDev
      ? []
      : [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ]),
    // Cross-Origin Embedder Policy
    {
      key: 'Cross-Origin-Embedder-Policy',
      value: 'credentialless',
    },
    // Cross-Origin Opener Policy
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin-allow-popups',
    },
    // Cross-Origin Resource Policy
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
    },
  ];
}

/**
 * Security headers specifically for service worker
 */
export function getServiceWorkerSecurityHeaders(): SecurityHeaderConfig[] {
  return [
    // Ensure service worker is interpreted as JavaScript
    {
      key: 'Content-Type',
      value: 'application/javascript; charset=utf-8',
    },
    // Prevent caching of service worker
    {
      key: 'Cache-Control',
      value: 'no-cache, no-store, must-revalidate',
    },
    // Service Worker specific CSP
    {
      key: 'Content-Security-Policy',
      value:
        "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; worker-src 'self' blob:",
    },
    // Service Worker scope
    {
      key: 'Service-Worker-Allowed',
      value: '/',
    },
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
  ];
}

/**
 * Security headers for API routes
 */
export function getAPISecurityHeaders(): SecurityHeaderConfig[] {
  return [
    // No caching for API routes
    {
      key: 'Cache-Control',
      value: 'no-store, max-age=0',
    },
    // API specific CSP
    {
      key: 'Content-Security-Policy',
      value: "default-src 'none'; frame-ancestors 'none';",
    },
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    // JSON content type
    {
      key: 'Content-Type',
      value: 'application/json; charset=utf-8',
    },
  ];
}

/**
 * Security headers for static assets
 */
export function getStaticAssetSecurityHeaders(): SecurityHeaderConfig[] {
  return [
    // Long-term caching for static assets
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    // Cross-Origin Resource Policy for static assets
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'cross-origin',
    },
  ];
}

/**
 * Security headers for PWA manifest
 */
export function getManifestSecurityHeaders(): SecurityHeaderConfig[] {
  return [
    // Manifest content type
    {
      key: 'Content-Type',
      value: 'application/manifest+json; charset=utf-8',
    },
    // Cache manifest for performance
    {
      key: 'Cache-Control',
      value: 'public, max-age=86400', // 24 hours
    },
    // Prevent MIME type sniffing
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
  ];
}

/**
 * Get all security headers configuration
 */
export function getSecurityHeadersConfig(
  isDev: boolean = false
): SecurityHeadersConfig {
  return {
    global: getGlobalSecurityHeaders(isDev),
    serviceWorker: getServiceWorkerSecurityHeaders(),
    api: getAPISecurityHeaders(),
    static: getStaticAssetSecurityHeaders(),
  };
}

/**
 * Security header validation
 */
export function validateSecurityHeaders(
  headers: SecurityHeaderConfig[]
): boolean {
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
  ];

  return requiredHeaders.every(required =>
    headers.some(header => header.key === required)
  );
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString(
    'base64'
  );
}

/**
 * Environment detection
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Security headers for different environments
 */
export const SECURITY_PRESETS = {
  development: {
    strictCSP: false,
    allowUnsafeInline: true,
    allowUnsafeEval: true,
    httpsEnforcement: false,
  },
  production: {
    strictCSP: true,
    allowUnsafeInline: false,
    allowUnsafeEval: false,
    httpsEnforcement: true,
  },
  testing: {
    strictCSP: false,
    allowUnsafeInline: true,
    allowUnsafeEval: true,
    httpsEnforcement: false,
  },
} as const;

export type SecurityPreset = keyof typeof SECURITY_PRESETS;
