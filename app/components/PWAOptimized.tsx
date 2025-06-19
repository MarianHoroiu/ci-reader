'use client';

import { useEffect, useState } from 'react';

interface PWAOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PWAOptimized component that applies PWA-specific fixes and optimizations
 * to ensure consistent rendering across browser and standalone PWA modes.
 */
export default function PWAOptimized({
  children,
  className = '',
}: PWAOptimizedProps) {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detect if running as PWA
    const checkPWAMode = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isIOSPWA = (window.navigator as any).standalone === true;
      const isAndroidPWA = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;

      setIsPWA(isStandalone || isIOSPWA || isAndroidPWA);
    };

    checkPWAMode();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAMode);

    return () => {
      mediaQuery.removeEventListener('change', checkPWAMode);
    };
  }, []);

  useEffect(() => {
    if (!isPWA) return;

    // Inject PWA-specific styles
    const styleId = 'pwa-optimization-styles';
    const existingStyle = document.getElementById(styleId);

    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .pwa-optimized {
          /* Force hardware acceleration */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }

        .pwa-optimized button,
        .pwa-optimized [role="button"],
        .pwa-optimized .btn-primary,
        .pwa-optimized .btn-secondary {
          /* Ensure consistent button behavior */
          -webkit-appearance: none;
          appearance: none;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform, background-color, box-shadow;
          
          /* Minimum touch target size */
          min-height: 44px;
          min-width: 44px;
        }

        .pwa-optimized .inline-flex {
          /* Fix flex display issues */
          display: -webkit-inline-flex !important;
          display: inline-flex !important;
        }

        .pwa-optimized .space-x-4 > * + * {
          margin-left: 1rem !important;
        }

        .pwa-optimized .space-x-3 > * + * {
          margin-left: 0.75rem !important;
        }

        .pwa-optimized .space-x-2 > * + * {
          margin-left: 0.5rem !important;
        }

        .pwa-optimized .gap-4 {
          gap: 1rem !important;
        }

        .pwa-optimized .gap-6 {
          gap: 1.5rem !important;
        }

        .pwa-optimized .gap-8 {
          gap: 2rem !important;
        }

        /* Fix absolute positioning for copy buttons and tooltips */
        .pwa-optimized .absolute {
          position: absolute !important;
        }

        .pwa-optimized .relative {
          position: relative !important;
        }

        .pwa-optimized .z-50 {
          z-index: 50 !important;
        }

        /* Fix transform animations */
        .pwa-optimized .transform {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        .pwa-optimized .hover\\:-translate-y-0\\.5:hover {
          -webkit-transform: translateY(-0.125rem) translateZ(0);
          transform: translateY(-0.125rem) translateZ(0);
        }

        /* Fix copy button positioning */
        .pwa-optimized .absolute.right-2.top-1\\/2 {
          right: 0.5rem !important;
          top: 50% !important;
          transform: translateY(-50%) translateZ(0) !important;
          -webkit-transform: translateY(-50%) translateZ(0) !important;
        }

        /* Fix toast positioning */
        .pwa-optimized .absolute.-top-10.right-0 {
          top: -2.5rem !important;
          right: 0 !important;
          transform: translateZ(0) !important;
          -webkit-transform: translateZ(0) !important;
        }

        /* Fix gradient backgrounds */
        .pwa-optimized .bg-gradient-to-r,
        .pwa-optimized .bg-gradient-to-br {
          background-attachment: scroll;
          -webkit-background-attachment: scroll;
        }

        /* Fix shadow rendering */
        .pwa-optimized .shadow-lg,
        .pwa-optimized .shadow-xl,
        .pwa-optimized .shadow-md {
          -webkit-filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }

        /* Fix modal positioning */
        .pwa-optimized .fixed.inset-0 {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
        }

        /* Fix viewport height issues */
        .pwa-optimized .min-h-screen {
          min-height: 100vh !important;
          min-height: -webkit-fill-available !important;
        }

        /* Fix flex-col and flex-row responsive behavior */
        .pwa-optimized .flex.flex-col.sm\\:flex-row {
          flex-direction: column !important;
        }

        @media (min-width: 640px) {
          .pwa-optimized .flex.flex-col.sm\\:flex-row {
            flex-direction: row !important;
          }
        }

                  /* Fix space-y and space-x responsive behavior */
          .pwa-optimized .space-y-3 > * + * {
            margin-top: 0.75rem !important;
            margin-left: 0 !important;
          }

          @media (min-width: 640px) {
            .pwa-optimized .sm\\:space-y-0 > * + * {
              margin-top: 0 !important;
            }
            
            .pwa-optimized .sm\\:space-x-4 > * + * {
              margin-left: 1rem !important;
            }
          }

          /* Fix gradient backgrounds - CRITICAL */
          .pwa-optimized .bg-gradient-to-r {
            background: linear-gradient(to right, var(--tw-gradient-stops)) !important;
          }

          .pwa-optimized .from-emerald-600.to-teal-600 {
            background: linear-gradient(to right, #059669, #0d9488) !important;
          }

          .pwa-optimized .hover\\:from-emerald-700:hover.hover\\:to-teal-700:hover {
            background: linear-gradient(to right, #047857, #0f766e) !important;
          }

          .pwa-optimized .from-emerald-500.to-teal-600 {
            background: linear-gradient(to right, #10b981, #0d9488) !important;
          }

          /* Fix SVG colors */
          .pwa-optimized svg {
            fill: currentColor !important;
          }

          .pwa-optimized .text-white svg {
            fill: white !important;
            color: white !important;
          }

          .pwa-optimized .text-blue-600 svg {
            fill: #2563eb !important;
            color: #2563eb !important;
          }

          .pwa-optimized .text-emerald-600 svg {
            fill: #059669 !important;
            color: #059669 !important;
          }

          .pwa-optimized .text-gray-400 svg {
            fill: #9ca3af !important;
            color: #9ca3af !important;
          }

          .pwa-optimized .text-gray-300 svg {
            fill: #d1d5db !important;
            color: #d1d5db !important;
          }

          /* Fix modal overflow */
          .pwa-optimized .fixed.inset-0.flex.items-center.justify-center {
            padding: 1rem !important;
            box-sizing: border-box !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .pwa-optimized .max-w-4xl {
            max-height: calc(100vh - 2rem) !important;
            max-width: calc(100vw - 2rem) !important;
            margin: auto !important;
          }

          .pwa-optimized .overflow-y-auto.flex-1 {
            overflow-y: auto !important;
            flex: 1 !important;
            min-height: 0 !important;
          }
      `;

      document.head.appendChild(style);
    }

    // Cleanup function
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isPWA]);

  const pwaClasses = isPWA ? 'pwa-optimized' : '';

  return <div className={`${pwaClasses} ${className}`}>{children}</div>;
}
