'use client';

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

interface ServiceWorkerRegistrationProps {
  onUpdateAvailable?: () => void;
  onOfflineReady?: () => void;
  showUpdatePrompt?: boolean;
}

export default function ServiceWorkerRegistration({
  onUpdateAvailable,
  onOfflineReady,
  showUpdatePrompt = true,
}: ServiceWorkerRegistrationProps) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: false,
    registration: null,
    error: null,
  });

  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setSwState(prev => ({ ...prev, isSupported: true }));
      registerServiceWorker();
    } else {
      setSwState(prev => ({
        ...prev,
        error: 'Service Workers are not supported in this browser',
      }));
    }

    // Monitor online/offline status
    const handleOnline = () =>
      setSwState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () =>
      setSwState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial offline status
    setSwState(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerServiceWorker = async () => {
    try {
      const wb = new Workbox('/sw.js');

      // Service worker installed for the first time
      wb.addEventListener('installed', event => {
        console.log('🎉 Service Worker installed successfully');

        if (!event.isUpdate) {
          setSwState(prev => ({ ...prev, isRegistered: true }));
          onOfflineReady?.();

          // Show offline ready notification
          if (showUpdatePrompt) {
            showNotification('App ready for offline use!', 'success');
          }
        }
      });

      // Service worker is waiting to activate (update available)
      wb.addEventListener('waiting', () => {
        console.log('🔄 Service Worker update available');
        setSwState(prev => ({ ...prev, isUpdateAvailable: true }));
        setShowUpdateBanner(true);
        onUpdateAvailable?.();
      });

      // Service worker activated (controlling the page)
      wb.addEventListener('controlling', () => {
        console.log('✅ Service Worker is now controlling the page');

        // Reload to ensure all resources are from the new SW
        if (swState.isUpdateAvailable) {
          window.location.reload();
        }
      });

      // Service worker registration failed
      wb.addEventListener('redundant', () => {
        console.warn('⚠️ Service Worker became redundant');
      });

      // Register the service worker
      const registration = await wb.register();

      setSwState(prev => ({
        ...prev,
        registration: registration || null,
        isRegistered: true,
      }));

      console.log('📱 Service Worker registered:', registration);

      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60000);
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      setSwState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
    }
  };

  const handleUpdateApp = () => {
    if (swState.registration?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
    }
  };

  const dismissUpdate = () => {
    setShowUpdateBanner(false);
    setSwState(prev => ({ ...prev, isUpdateAvailable: false }));
  };

  const showNotification = (
    message: string,
    type: 'success' | 'info' | 'warning' = 'info'
  ) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `sw-toast sw-toast-${type}`;
    toast.textContent = message;

    // Add styles
    const styles = `
      .sw-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
      }
      .sw-toast-success { background: #10b981; }
      .sw-toast-info { background: #3b82f6; }
      .sw-toast-warning { background: #f59e0b; }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;

    // Add styles to head if not already present
    if (!document.querySelector('#sw-toast-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'sw-toast-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  // Don't render anything if service workers aren't supported
  if (!swState.isSupported) {
    return null;
  }

  return (
    <>
      {/* Update Available Banner */}
      {showUpdateBanner && showUpdatePrompt && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-sm">🔄</span>
              </div>
              <div>
                <p className="font-medium">Actualizare disponibilă</p>
                <p className="text-sm text-blue-100">
                  O versiune nouă a aplicației este disponibilă
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpdateApp}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Actualizează
              </button>
              <button
                onClick={dismissUpdate}
                className="text-blue-100 hover:text-white transition-colors"
                aria-label="Dismiss update notification"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {swState.isOffline && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Offline</span>
          </div>
        </div>
      )}

      {/* Error Display (Development only) */}
      {swState.error && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-40 max-w-sm">
          <h4 className="font-medium mb-1">Service Worker Error</h4>
          <p className="text-sm text-red-100">{swState.error}</p>
        </div>
      )}
    </>
  );
}

// Export types for external use
export type { ServiceWorkerState, ServiceWorkerRegistrationProps };
