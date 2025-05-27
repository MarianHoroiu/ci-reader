'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

/**
 * Security Provider for Romanian ID Processing PWA
 * Provides security context and client-side security features
 */

interface SecurityContextType {
  isSecureContext: boolean;
  httpsEnabled: boolean;
  cspViolations: CSPViolation[];
  securityScore: number;
  // eslint-disable-next-line no-unused-vars
  reportCSPViolation: (violation: CSPViolation) => void;
  checkSecurityFeatures: () => SecurityFeatures;
}

interface CSPViolation {
  blockedURI: string;
  documentURI: string;
  effectiveDirective: string;
  originalPolicy: string;
  referrer: string;
  statusCode: number;
  violatedDirective: string;
  timestamp: number;
}

interface SecurityFeatures {
  serviceWorkerSupported: boolean;
  notificationsSupported: boolean;
  pushSupported: boolean;
  httpsEnabled: boolean;
  secureContext: boolean;
  webCryptoSupported: boolean;
  credentialsSupported: boolean;
}

interface SecurityProviderProps {
  children: ReactNode;
  enableCSPReporting?: boolean;
  enableSecurityMonitoring?: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

export function SecurityProvider({
  children,
  enableCSPReporting = true,
  enableSecurityMonitoring = true,
}: SecurityProviderProps) {
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [httpsEnabled, setHttpsEnabled] = useState(false);
  const [cspViolations, setCspViolations] = useState<CSPViolation[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  const checkSecurityFeatures = useCallback((): SecurityFeatures => {
    if (typeof window === 'undefined') {
      return {
        serviceWorkerSupported: false,
        notificationsSupported: false,
        pushSupported: false,
        httpsEnabled: false,
        secureContext: false,
        webCryptoSupported: false,
        credentialsSupported: false,
      };
    }

    return {
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationsSupported: 'Notification' in window,
      pushSupported: 'PushManager' in window,
      httpsEnabled: window.location.protocol === 'https:',
      secureContext: window.isSecureContext,
      webCryptoSupported: 'crypto' in window && 'subtle' in window.crypto,
      credentialsSupported: 'credentials' in navigator,
    };
  }, []);

  const calculateSecurityScore = useCallback(() => {
    if (typeof window === 'undefined') return;

    let score = 0;
    const features = checkSecurityFeatures();

    // Scoring criteria
    if (features.secureContext) score += 25;
    if (features.httpsEnabled) score += 20;
    if (features.serviceWorkerSupported) score += 15;
    if (features.webCryptoSupported) score += 15;
    if (features.notificationsSupported) score += 10;
    if (features.pushSupported) score += 10;
    if (features.credentialsSupported) score += 5;

    setSecurityScore(score);
  }, [checkSecurityFeatures]);

  useEffect(() => {
    // Check security context
    if (typeof window !== 'undefined') {
      setIsSecureContext(window.isSecureContext);
      setHttpsEnabled(window.location.protocol === 'https:');

      // Calculate initial security score
      calculateSecurityScore();
    }
  }, [calculateSecurityScore]);

  useEffect(() => {
    if (!enableCSPReporting || typeof window === 'undefined') return;

    // CSP violation reporting
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
        timestamp: Date.now(),
      };

      setCspViolations(prev => [...prev, violation]);

      // Log violation in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 CSP Violation:', violation);
      }
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener(
        'securitypolicyviolation',
        handleCSPViolation
      );
    };
  }, [enableCSPReporting]);

  useEffect(() => {
    if (!enableSecurityMonitoring || typeof window === 'undefined') return;

    // Security monitoring
    const monitoringInterval = setInterval(() => {
      calculateSecurityScore();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitoringInterval);
  }, [enableSecurityMonitoring, calculateSecurityScore]);

  const reportCSPViolation = (violation: CSPViolation) => {
    setCspViolations(prev => [...prev, violation]);

    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track('csp_violation', violation);
      console.warn('CSP Violation reported:', violation);
    }
  };

  const contextValue: SecurityContextType = {
    isSecureContext,
    httpsEnabled,
    cspViolations,
    securityScore,
    reportCSPViolation,
    checkSecurityFeatures,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
      {enableSecurityMonitoring && process.env.NODE_ENV === 'development' && (
        <SecurityDebugPanel />
      )}
    </SecurityContext.Provider>
  );
}

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error(
      'useSecurityContext must be used within a SecurityProvider'
    );
  }
  return context;
}

// Debug panel for development
function SecurityDebugPanel() {
  const {
    isSecureContext,
    httpsEnabled,
    cspViolations,
    securityScore,
    checkSecurityFeatures,
  } = useSecurityContext();

  const [isVisible, setIsVisible] = useState(false);
  const features = checkSecurityFeatures();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 text-xs"
        title="Security Debug Panel"
      >
        🔒
      </button>

      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm text-xs">
          <h3 className="font-bold mb-2">Security Debug Panel</h3>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Security Score:</span>
              <span
                className={
                  securityScore >= 80
                    ? 'text-green-600'
                    : securityScore >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }
              >
                {securityScore}/100
              </span>
            </div>

            <div className="flex justify-between">
              <span>Secure Context:</span>
              <span
                className={isSecureContext ? 'text-green-600' : 'text-red-600'}
              >
                {isSecureContext ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>HTTPS:</span>
              <span
                className={httpsEnabled ? 'text-green-600' : 'text-red-600'}
              >
                {httpsEnabled ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span
                className={
                  features.serviceWorkerSupported
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {features.serviceWorkerSupported ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Push Notifications:</span>
              <span
                className={
                  features.pushSupported ? 'text-green-600' : 'text-red-600'
                }
              >
                {features.pushSupported ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Web Crypto:</span>
              <span
                className={
                  features.webCryptoSupported
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {features.webCryptoSupported ? '✅' : '❌'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>CSP Violations:</span>
              <span
                className={
                  cspViolations.length === 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {cspViolations.length}
              </span>
            </div>
          </div>

          {cspViolations.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600">
                Recent CSP Violations ({cspViolations.slice(-3).length})
              </summary>
              <div className="mt-1 space-y-1 text-xs">
                {cspViolations.slice(-3).map((violation, index) => (
                  <div key={index} className="bg-red-50 p-1 rounded">
                    <div>Directive: {violation.violatedDirective}</div>
                    <div>URI: {violation.blockedURI}</div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </>
  );
}

// Hook for checking if PWA features are available
export function usePWASecurityCheck() {
  const { isSecureContext, checkSecurityFeatures } = useSecurityContext();

  const isPWAReady = () => {
    const features = checkSecurityFeatures();
    return (
      isSecureContext &&
      features.serviceWorkerSupported &&
      features.httpsEnabled
    );
  };

  const getSecurityWarnings = (): string[] => {
    const warnings: string[] = [];
    const features = checkSecurityFeatures();

    if (!isSecureContext) {
      warnings.push(
        'App is not running in a secure context. PWA features may not work.'
      );
    }

    if (!features.httpsEnabled) {
      warnings.push('HTTPS is not enabled. Some PWA features require HTTPS.');
    }

    if (!features.serviceWorkerSupported) {
      warnings.push('Service Workers are not supported in this browser.');
    }

    if (!features.notificationsSupported) {
      warnings.push('Push notifications are not supported in this browser.');
    }

    return warnings;
  };

  return {
    isPWAReady: isPWAReady(),
    securityWarnings: getSecurityWarnings(),
    features: checkSecurityFeatures(),
  };
}
