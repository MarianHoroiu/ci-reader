'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPWAInstallCapabilities,
  checkPWAInstallCriteria,
  hasUserDismissedInstallPrompt,
  markInstallPromptDismissed,
  getIOSInstallInstructions,
  type PWAInstallCapabilities,
} from '../lib/pwa/pwa-utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  // Capabilities
  capabilities: PWAInstallCapabilities;
  canShowPrompt: boolean;
  isInstallable: boolean;

  // State
  isInstalling: boolean;
  isInstalled: boolean;
  hasBeenDismissed: boolean;
  showIOSInstructions: boolean;

  // Install criteria
  installCriteria: {
    hasManifest: boolean;
    hasServiceWorker: boolean;
    isSecure: boolean;
    meetsMinimumRequirements: boolean;
  } | null;

  // Error handling
  error: string | null;
}

export interface InstallPromptActions {
  // Install actions
  triggerInstall: () => Promise<boolean>;
  showIOSInstructions: () => void;
  hideIOSInstructions: () => void;

  // Prompt management
  dismissPrompt: () => void;
  resetDismissal: () => void;

  // Manual checks
  checkInstallability: () => Promise<void>;
}

export interface UseInstallPromptReturn {
  state: InstallPromptState;
  actions: InstallPromptActions;
  iosInstructions: {
    steps: string[];
    browserSpecific: boolean;
  };
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [state, setState] = useState<InstallPromptState>({
    capabilities: {
      canInstall: false,
      platform: 'unknown',
      browser: 'unknown',
      supportsBeforeInstallPrompt: false,
      isStandalone: false,
      isInstalled: false,
    },
    canShowPrompt: false,
    isInstallable: false,
    isInstalling: false,
    isInstalled: false,
    hasBeenDismissed: false,
    showIOSInstructions: false,
    installCriteria: null,
    error: null,
  });

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const hasInitialized = useRef(false);

  // Initialize capabilities and check install criteria
  const initializeInstallPrompt = useCallback(async () => {
    if (typeof window === 'undefined' || hasInitialized.current) return;

    try {
      const capabilities = getPWAInstallCapabilities();
      const installCriteria = await checkPWAInstallCriteria();
      const hasBeenDismissed = hasUserDismissedInstallPrompt();

      const isInstallable =
        capabilities.canInstall && installCriteria.meetsMinimumRequirements;
      const canShowPrompt =
        isInstallable && !hasBeenDismissed && !capabilities.isInstalled;

      setState(prev => ({
        ...prev,
        capabilities,
        installCriteria,
        isInstallable,
        canShowPrompt,
        isInstalled: capabilities.isInstalled,
        hasBeenDismissed,
        error: null,
      }));

      hasInitialized.current = true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize install prompt',
      }));
    }
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      setState(prev => ({
        ...prev,
        canShowPrompt:
          prev.isInstallable && !prev.hasBeenDismissed && !prev.isInstalled,
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canShowPrompt: false,
        isInstalling: false,
      }));

      // Clear the deferred prompt
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeInstallPrompt();
  }, [initializeInstallPrompt]);

  // Monitor display mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isInstalled: e.matches,
        canShowPrompt:
          !e.matches && prev.isInstallable && !prev.hasBeenDismissed,
      }));
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Trigger install prompt
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (state.isInstalling) return false;

    setState(prev => ({ ...prev, isInstalling: true, error: null }));

    try {
      // Handle Arc browser specifically
      if (state.capabilities.browser === 'arc') {
        setState(prev => ({
          ...prev,
          showIOSInstructions: true,
          isInstalling: false,
          error:
            'Arc browser does not support PWA installation. Please try Chrome, Edge, or Safari.',
        }));
        return false;
      }

      // Handle iOS case
      if (state.capabilities.platform === 'ios') {
        setState(prev => ({
          ...prev,
          showIOSInstructions: true,
          isInstalling: false,
        }));
        return false;
      }

      // Handle browsers with beforeinstallprompt support
      if (deferredPromptRef.current) {
        // Add timeout for browsers that don't properly handle the prompt
        const installPromise = Promise.race([
          (async () => {
            await deferredPromptRef.current!.prompt();
            return await deferredPromptRef.current!.userChoice;
          })(),
          new Promise<{ outcome: 'timeout' }>((_, reject) =>
            setTimeout(
              () => reject(new Error('Installation prompt timeout')),
              5000
            )
          ),
        ]);

        try {
          const choiceResult = await installPromise;

          if (choiceResult.outcome === 'accepted') {
            setState(prev => ({
              ...prev,
              isInstalled: true,
              canShowPrompt: false,
              isInstalling: false,
            }));
            deferredPromptRef.current = null;
            return true;
          } else {
            // User dismissed the prompt
            markInstallPromptDismissed();
            setState(prev => ({
              ...prev,
              hasBeenDismissed: true,
              canShowPrompt: false,
              isInstalling: false,
            }));
            return false;
          }
        } catch (timeoutError) {
          // Handle timeout or other errors
          setState(prev => ({
            ...prev,
            isInstalling: false,
            showIOSInstructions: true,
            error:
              'Installation prompt failed. Your browser may not support PWA installation.',
          }));
          return false;
        }
      }

      // Fallback for browsers without beforeinstallprompt
      if (state.capabilities.browser === 'firefox') {
        // Firefox doesn't have beforeinstallprompt, but may support manual installation
        setState(prev => ({
          ...prev,
          showIOSInstructions: true,
          isInstalling: false,
        }));
        return false;
      }

      throw new Error('Installation not supported on this browser');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Installation failed',
      }));
      return false;
    }
  }, [state.isInstalling, state.capabilities]);

  // Show iOS instructions
  const showIOSInstructions = useCallback(() => {
    setState(prev => ({ ...prev, showIOSInstructions: true }));
  }, []);

  // Hide iOS instructions
  const hideIOSInstructions = useCallback(() => {
    setState(prev => ({ ...prev, showIOSInstructions: false }));
  }, []);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    markInstallPromptDismissed();
    setState(prev => ({
      ...prev,
      hasBeenDismissed: true,
      canShowPrompt: false,
    }));
  }, []);

  // Reset dismissal state
  const resetDismissal = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasBeenDismissed: false,
      canShowPrompt: prev.isInstallable && !prev.isInstalled,
    }));
  }, []);

  // Manual installability check
  const checkInstallability = useCallback(async () => {
    await initializeInstallPrompt();
  }, [initializeInstallPrompt]);

  // Get iOS instructions
  const iosInstructions = getIOSInstallInstructions();

  return {
    state,
    actions: {
      triggerInstall,
      showIOSInstructions,
      hideIOSInstructions,
      dismissPrompt,
      resetDismissal,
      checkInstallability,
    },
    iosInstructions,
  };
}
