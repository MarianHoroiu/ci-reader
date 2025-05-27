/**
 * PWA Detection and Installation Utilities
 * Provides helper functions for PWA installation and platform detection
 */

export interface PWAInstallCapabilities {
  canInstall: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'arc' | 'unknown';
  supportsBeforeInstallPrompt: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
}

/**
 * Detect the current platform
 */
export function detectPlatform(): PWAInstallCapabilities['platform'] {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';

  // iOS detection
  if (
    /ipad|iphone|ipod/.test(userAgent) ||
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
  ) {
    return 'ios';
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }

  // Desktop detection
  if (/win|mac|linux/.test(platform) || /windows|macintosh/.test(userAgent)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Detect the current browser
 */
export function detectBrowser(): PWAInstallCapabilities['browser'] {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Arc browser detection (Arc uses Chrome engine but has different behavior)
  if (
    userAgent.includes('arc/') ||
    (userAgent.includes('chrome/') &&
      window.navigator.userAgent.includes('Arc'))
  ) {
    return 'arc';
  }

  if (userAgent.includes('edg/')) return 'edge';
  if (userAgent.includes('chrome/') && !userAgent.includes('edg/'))
    return 'chrome';
  if (userAgent.includes('firefox/')) return 'firefox';
  if (userAgent.includes('safari/') && !userAgent.includes('chrome/'))
    return 'safari';

  return 'unknown';
}

/**
 * Check if the app is running in standalone mode
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for standalone mode
  const isStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return isStandaloneMode;
}

/**
 * Check if the app is already installed
 */
export function isAppInstalled(): boolean {
  return isStandalone();
}

/**
 * Check if the browser supports beforeinstallprompt event
 */
export function supportsBeforeInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  const platform = detectPlatform();
  const browser = detectBrowser();

  // iOS Safari doesn't support beforeinstallprompt
  if (platform === 'ios') return false;

  // Arc browser has beforeinstallprompt but no UI for installation
  if (browser === 'arc') return false;

  // Chrome and Edge support it
  if (browser === 'chrome' || browser === 'edge') return true;

  // Firefox has limited support
  if (browser === 'firefox') return false;

  return false;
}

/**
 * Check if PWA installation is possible on current platform/browser
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;

  const platform = detectPlatform();
  const browser = detectBrowser();

  // Already installed
  if (isAppInstalled()) return false;

  // Arc browser doesn't support PWA installation
  if (browser === 'arc') return false;

  // iOS Safari supports manual installation
  if (platform === 'ios' && browser === 'safari') return true;

  // Chrome/Edge support automatic installation
  if (browser === 'chrome' || browser === 'edge') return true;

  // Firefox on desktop has some support
  if (browser === 'firefox' && platform === 'desktop') return true;

  return false;
}

/**
 * Get comprehensive PWA installation capabilities
 */
export function getPWAInstallCapabilities(): PWAInstallCapabilities {
  return {
    canInstall: canInstallPWA(),
    platform: detectPlatform(),
    browser: detectBrowser(),
    supportsBeforeInstallPrompt: supportsBeforeInstallPrompt(),
    isStandalone: isStandalone(),
    isInstalled: isAppInstalled(),
  };
}

/**
 * Check if the current page meets PWA installability criteria
 */
export async function checkPWAInstallCriteria(): Promise<{
  hasManifest: boolean;
  hasServiceWorker: boolean;
  isSecure: boolean;
  meetsMinimumRequirements: boolean;
}> {
  const hasManifest = !!document.querySelector('link[rel="manifest"]');

  let hasServiceWorker = false;
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      hasServiceWorker = !!registration;
    } catch {
      hasServiceWorker = false;
    }
  }

  const isSecure =
    location.protocol === 'https:' || location.hostname === 'localhost';

  const meetsMinimumRequirements = hasManifest && hasServiceWorker && isSecure;

  return {
    hasManifest,
    hasServiceWorker,
    isSecure,
    meetsMinimumRequirements,
  };
}

/**
 * Get browser-specific installation instructions
 */
export function getBrowserInstallInstructions(): {
  steps: string[];
  browserSpecific: boolean;
  canInstall: boolean;
} {
  const browser = detectBrowser();
  const platform = detectPlatform();

  // Arc browser specific message
  if (browser === 'arc') {
    return {
      steps: [
        'Arc browser currently does not support PWA installation',
        'Please try using Chrome, Edge, or Safari instead',
        'Copy this URL and open it in a supported browser',
        'Then you can install the app from there',
      ],
      browserSpecific: true,
      canInstall: false,
    };
  }

  // iOS Safari
  if (platform === 'ios' && browser === 'safari') {
    return {
      steps: [
        'Tap the Share button at the bottom of the screen',
        'Scroll down and tap "Add to Home Screen"',
        'Customize the name if desired',
        'Tap "Add" to install the app',
      ],
      browserSpecific: true,
      canInstall: true,
    };
  }

  // Chrome/Edge
  if (browser === 'chrome' || browser === 'edge') {
    return {
      steps: [
        'Click the install button or look for the install icon in the address bar',
        'Click "Install" in the popup dialog',
        'The app will be installed and available in your apps',
      ],
      browserSpecific: true,
      canInstall: true,
    };
  }

  // Firefox
  if (browser === 'firefox') {
    return {
      steps: [
        'Firefox has limited PWA support',
        'You can bookmark this page for quick access',
        'Or try using Chrome or Edge for full installation',
      ],
      browserSpecific: true,
      canInstall: false,
    };
  }

  return {
    steps: [
      'Open this page in Safari',
      'Tap the Share button',
      'Select "Add to Home Screen"',
      'Tap "Add" to install',
    ],
    browserSpecific: false,
    canInstall: true,
  };
}

/**
 * Get iOS-specific installation instructions (legacy function for backward compatibility)
 */
export function getIOSInstallInstructions(): {
  steps: string[];
  browserSpecific: boolean;
} {
  const instructions = getBrowserInstallInstructions();
  return {
    steps: instructions.steps,
    browserSpecific: instructions.browserSpecific,
  };
}

/**
 * Storage key for install prompt preferences
 */
export const INSTALL_PROMPT_STORAGE_KEY = 'pwa-install-prompt-dismissed';

/**
 * Check if user has dismissed the install prompt
 */
export function hasUserDismissedInstallPrompt(): boolean {
  if (typeof localStorage === 'undefined') return false;

  try {
    const dismissed = localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY);
    if (!dismissed) return false;

    const { timestamp, count } = JSON.parse(dismissed);
    const daysSinceDismissal = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

    // Reset after 7 days or if dismissed less than 3 times
    return daysSinceDismissal < 7 && count >= 3;
  } catch {
    return false;
  }
}

/**
 * Mark install prompt as dismissed
 */
export function markInstallPromptDismissed(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const existing = localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY);
    let count = 1;

    if (existing) {
      const parsed = JSON.parse(existing);
      count = (parsed.count || 0) + 1;
    }

    localStorage.setItem(
      INSTALL_PROMPT_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        count,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear install prompt dismissal state
 */
export function clearInstallPromptDismissal(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.removeItem(INSTALL_PROMPT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
