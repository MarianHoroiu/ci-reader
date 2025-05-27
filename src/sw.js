/**
 * Service Worker for Romanian ID Processing PWA
 * Enhanced with security considerations and Workbox integration
 */

// Workbox manifest placeholder (will be replaced during build)
const WB_MANIFEST = self.__WB_MANIFEST || [];

// Security: Define allowed origins and validate requests
const ALLOWED_ORIGINS = [
  self.location.origin,
  // Add other allowed origins if needed
];

// Development mode detection
const IS_DEVELOPMENT =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.port === '3000' ||
  (self.location.hostname === 'localhost' &&
    self.location.protocol === 'http:');

// Cache names with versioning for security (following best practices)
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `romanian-id-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `romanian-id-dynamic-${CACHE_VERSION}`;
const SECURITY_CACHE = `romanian-id-security-${CACHE_VERSION}`;
const FONTS_CACHE = `romanian-id-fonts-${CACHE_VERSION}`;

// Cache configuration following best practices
const CACHE_CONFIG = {
  STATIC_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC_MAX_AGE: 24 * 60 * 60 * 1000, // 1 day
  FONTS_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_ENTRIES: {
    STATIC: 100,
    DYNAMIC: 50,
    FONTS: 30,
  },
};

// Static assets to cache (security-conscious list)
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

// Security: Validate request origin
function isSecureRequest(request) {
  try {
    const origin = new URL(request.url).origin;
    return ALLOWED_ORIGINS.includes(origin);
  } catch (error) {
    return false;
  }
}

// Security: Validate and sanitize response
function validateResponse(response) {
  // Check for CSP header (warn if missing)
  if (
    !response.headers.get('Content-Security-Policy') &&
    response.url.includes(self.location.origin)
  ) {
    console.warn('🚨 SW Security: Response missing CSP header', response.url);
  }

  return response;
}

// Enhanced caching strategy with security checks
async function handleRequest(request, url) {
  // Static assets: cache-first strategy
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico)$/) ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/')
  ) {
    return cacheFirstStrategy(request, STATIC_CACHE);
  }

  // Fonts: cache-first with longer TTL
  if (url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
    return cacheFirstStrategy(request, FONTS_CACHE);
  }

  // API routes and dynamic content: network-first strategy
  if (
    url.pathname.startsWith('/api/') ||
    (url.pathname.startsWith('/_next/') &&
      !url.pathname.startsWith('/_next/static/'))
  ) {
    return networkFirstStrategy(request, DYNAMIC_CACHE);
  }

  // Documents: cache-first for better performance
  if (request.destination === 'document') {
    return cacheFirstStrategy(request, STATIC_CACHE);
  }

  // Default: network-first
  return networkFirstStrategy(request, DYNAMIC_CACHE);
}

// Cache-first strategy with fallback
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(
        '📋 Service Worker: Serving from cache (cache-first)',
        request.url
      );
      return validateResponse(cachedResponse);
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(cacheName);

      // Manage cache size
      await manageCacheSize(cache, CACHE_CONFIG.MAX_ENTRIES.STATIC);

      await cache.put(request, responseClone);
      console.log(
        '💾 Service Worker: Cached new resource (cache-first)',
        request.url
      );
      return validateResponse(networkResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Service Worker: Cache-first fallback', error);

    // Fallback to offline page for documents
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    // Try to serve from cache as last resort
    return caches.match(request);
  }
}

// Network-first strategy with cache fallback
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(cacheName);

      // Manage cache size
      await manageCacheSize(cache, CACHE_CONFIG.MAX_ENTRIES.DYNAMIC);

      await cache.put(request, responseClone);
      console.log(
        '💾 Service Worker: Cached new resource (network-first)',
        request.url
      );
      return validateResponse(networkResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log(
      '🌐 Service Worker: Network failed, trying cache (network-first)',
      error
    );

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(
        '📋 Service Worker: Serving from cache (network-first fallback)',
        request.url
      );
      return validateResponse(cachedResponse);
    }

    // Fallback to offline page for documents
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

// Cache size management with FIFO cleanup
async function manageCacheSize(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length >= maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries + 1);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Secure background sync
async function performSecureBackgroundSync() {
  try {
    console.log('🔄 Service Worker: Performing secure background sync');
    // Add your background sync logic here
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Service Worker: Secure background sync failed', error);
    throw error;
  }
}

// Secure URL validation for notifications
function sanitizeNotificationUrl(url) {
  try {
    const sanitizedUrl = new URL(url, self.location.origin);
    if (sanitizedUrl.origin !== self.location.origin) {
      return '/';
    }
    return sanitizedUrl.pathname + sanitizedUrl.search;
  } catch (error) {
    return '/';
  }
}

// Install event with security checks and Workbox manifest
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing with security enhancements...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Service Worker: Caching static assets securely');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache Workbox manifest assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Service Worker: Caching Workbox manifest assets');
        const manifestUrls = WB_MANIFEST.map(entry => entry.url);
        return cache.addAll(manifestUrls);
      }),
    ])
      .then(() => {
        console.log('✅ Service Worker: All assets cached securely');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Failed to cache assets', error);
      })
  );
});

// Activate event with enhanced cache cleanup
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating with security checks...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Security: Only delete caches we recognize
            if (
              ![
                STATIC_CACHE,
                DYNAMIC_CACHE,
                SECURITY_CACHE,
                FONTS_CACHE,
              ].includes(cacheName) &&
              (cacheName.startsWith('romanian-id-') ||
                cacheName.startsWith('static-v') ||
                cacheName.startsWith('dynamic-v') ||
                cacheName.startsWith('fonts-v') ||
                cacheName.startsWith('security-v'))
            ) {
              console.log(
                '🗑️ Service Worker: Deleting old cache securely',
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated securely');
        return self.clients.claim();
      })
  );
});

// Enhanced fetch event with comprehensive security checks
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Security: Validate request
  if (!isSecureRequest(request)) {
    console.warn('🚨 SW Security: Blocked insecure request', request.url);
    return;
  }

  // Security: Only handle safe methods from same origin
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method) ||
    !isSecureRequest(request)
  ) {
    return;
  }

  // Security: Only handle GET requests from same origin
  if (request.method === 'GET' && url.origin === self.location.origin) {
    // Skip webpack HMR and development files
    if (
      url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.startsWith('/_next/static/chunks/webpack.js')
    ) {
      return;
    }

    // In development mode, skip caching to prevent stale content
    if (IS_DEVELOPMENT) {
      console.log(
        '🔧 Service Worker: Development mode - bypassing cache for',
        request.url
      );

      // Graceful fallback when development server is down
      fetch(request).catch(error => {
        console.log(
          '🌐 Service Worker: Development server unavailable, serving offline page',
          error.message
        );

        if (request.destination === 'document') {
          return caches.match('/offline.html').then(cachedResponse => {
            return (
              cachedResponse ||
              new Response(
                `<!DOCTYPE html>
              <html>
                <head>
                  <title>Development Server Offline</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
                    .error { color: #dc2626; margin: 2rem 0; }
                    .info { color: #6b7280; }
                  </style>
                </head>
                <body>
                  <h1>Development Server Offline</h1>
                  <div class="error">The Next.js development server is not running.</div>
                  <div class="info">Please start the server with: <code>npm run dev</code></div>
                  <button onclick="window.location.reload()">Retry</button>
                </body>
              </html>`,
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/html' },
                }
              )
            );
          });
        }

        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            console.log(
              '📋 Service Worker: Serving from cache (server offline)',
              request.url
            );
            return cachedResponse;
          }
          return new Response('Development server offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      });

      return;
    }

    // Production caching strategy
    event.respondWith(handleRequest(request, url));
  }
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(performSecureBackgroundSync());
  }
});

// Push notification event with security
self.addEventListener('push', event => {
  console.log('📱 Service Worker: Push received', event);

  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('🚨 SW Security: Invalid push data', error);
    return;
  }

  // Sanitize notification body
  function sanitizeNotificationBody(body) {
    if (typeof body !== 'string') {
      return 'Romanian ID Processor notification';
    }

    // Remove any script tags and HTML
    return body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .substring(0, 200);
  }

  const options = {
    body: sanitizeNotificationBody(
      data.body || 'Romanian ID Processor notification'
    ),
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: sanitizeNotificationUrl(data.url || '/'),
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.svg',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.svg',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Romanian ID Processor', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('🔔 Service Worker: Notification clicked', event);

  event.notification.close();

  if (event.action === 'explore') {
    const urlToOpen = sanitizeNotificationUrl(
      event.notification.data?.url || '/'
    );
    event.waitUntil(self.clients.openWindow(urlToOpen));
  }
});

// Message event with origin validation
self.addEventListener('message', event => {
  console.log('💬 Service Worker: Message received', event.data);

  // Security: Validate message origin
  if (!isSecureRequest({ url: event.origin })) {
    console.warn('🚨 SW Security: Message from invalid origin', event.origin);
    return;
  }

  if (event.data && typeof event.data === 'object') {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }

    if (event.data.type === 'GET_VERSION') {
      event.ports[0].postMessage({
        version: 'romanian-id-pwa-v3-workbox',
        timestamp: Date.now(),
        security: true,
        workbox: true,
      });
    }
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('🚨 Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('🚨 Service Worker Unhandled Rejection:', event.reason);
});

console.log(
  '🔒 Service Worker: Loaded with security enhancements and Workbox integration'
);
