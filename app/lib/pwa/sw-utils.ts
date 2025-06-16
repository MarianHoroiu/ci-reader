/**
 * Service Worker Utilities for Romanian ID Processing PWA
 * Provides helper functions for cache management and offline functionality
 */

// Cache names used by the service worker
export const CACHE_NAMES = {
  STATIC: 'static-assets-v1',
  APP_SHELL: 'app-shell-v1',
  API: 'api-cache-v1',
  FONTS: 'fonts-v1',
  OFFLINE_FALLBACKS: 'offline-fallbacks-v1',
  FORM_SUBMISSIONS: 'form-submissions-v1',
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  STATIC_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  APP_SHELL_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  API_MAX_AGE: 24 * 60 * 60 * 1000, // 1 day
  FONTS_MAX_AGE: 365 * 24 * 60 * 60 * 1000, // 1 year
  MAX_ENTRIES: {
    STATIC: 100,
    APP_SHELL: 50,
    API: 50,
    FONTS: 30,
  },
} as const;

/**
 * Check if the browser supports service workers
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Check if the app is currently offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
}

/**
 * Check if there's an update available for the service worker
 */
export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();

  if (!registration) {
    return false;
  }

  try {
    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error('Failed to check for service worker update:', error);
    return false;
  }
}

/**
 * Skip waiting and activate the new service worker
 */
export async function skipWaitingAndActivate(): Promise<void> {
  const registration = await getServiceWorkerRegistration();

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Clear all caches managed by the service worker
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof caches === 'undefined') {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName =>
      caches.delete(cacheName)
    );
    await Promise.all(deletePromises);
    console.log('All caches cleared successfully');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Clear a specific cache by name
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (typeof caches === 'undefined') {
    return false;
  }

  try {
    const deleted = await caches.delete(cacheName);
    if (deleted) {
      console.log(`Cache "${cacheName}" cleared successfully`);
    }
    return deleted;
  } catch (error) {
    console.error(`Failed to clear cache "${cacheName}":`, error);
    return false;
  }
}

/**
 * Get cache storage usage information
 */
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentage,
    };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Preload critical resources
 */
export async function preloadCriticalResources(urls: string[]): Promise<void> {
  if (typeof caches === 'undefined') {
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAMES.APP_SHELL);
    const requests = urls.map(url => new Request(url, { cache: 'no-cache' }));

    await Promise.allSettled(
      requests.map(async request => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          }
        } catch (error) {
          console.warn(`Failed to preload resource: ${request.url}`, error);
        }
      })
    );

    console.log('Critical resources preloaded successfully');
  } catch (error) {
    console.error('Failed to preload critical resources:', error);
  }
}

/**
 * Check if a resource is cached
 */
export async function isResourceCached(url: string): Promise<boolean> {
  if (typeof caches === 'undefined') {
    return false;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Failed to check if resource is cached: ${url}`, error);
    return false;
  }
}

/**
 * Network-first fetch with cache fallback
 */
export async function fetchWithCacheFallback(
  url: string,
  options?: any
): Promise<Response | null> {
  try {
    // Try network first
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.warn(`Network request failed for ${url}, trying cache...`);
  }

  // Fallback to cache
  if (typeof caches !== 'undefined') {
    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log(`Serving ${url} from cache: ${cacheName}`);
          return cachedResponse;
        }
      }
    } catch (error) {
      console.error(`Failed to get cached response for ${url}:`, error);
    }
  }

  return null;
}

/**
 * Add event listeners for online/offline status
 */
export function addNetworkStatusListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    console.log('🌐 Network: Back online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('📴 Network: Gone offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Show a notification (if permission granted)
 */
export async function showNotification(
  title: string,
  options?: any
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  // Check permission
  if (Notification.permission === 'granted') {
    const registration = await getServiceWorkerRegistration();

    if (registration) {
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        ...options,
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.svg',
        ...options,
      });
    }
  } else if (Notification.permission === 'default') {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await showNotification(title, options);
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<string> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Get app installation prompt
 */
export function getInstallPrompt(): Event | null {
  // This would be set by a beforeinstallprompt event listener
  return (window as any).deferredPrompt || null;
}

/**
 * Check if app is installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Debug: Log all cache contents
 */
export async function debugLogCacheContents(): Promise<void> {
  if (typeof caches === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.group('🗂️ Cache Contents Debug');

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      console.group(`📦 ${cacheName} (${requests.length} items)`);
      requests.forEach(request => {
        console.log(`  • ${request.url}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  } catch (error) {
    console.error('Failed to debug cache contents:', error);
  }
}
