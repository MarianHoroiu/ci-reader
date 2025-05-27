'use client';

import { useEffect, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import InstallButton from './InstallButton';
import styles from '../styles/install-prompt.module.css';

export interface InstallPromptProps {
  variant?: 'card' | 'banner' | 'minimal';
  showAfterDelay?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  onInstallSuccess?: () => void;
  // eslint-disable-next-line no-unused-vars
  onInstallError?: (error: string) => void;
  onDismiss?: () => void;
}

export default function InstallPrompt({
  variant = 'card',
  showAfterDelay = 3000,
  autoHide = false,
  autoHideDelay = 10000,
  onInstallSuccess,
  onInstallError,
  onDismiss,
}: InstallPromptProps) {
  const { state, actions, iosInstructions } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Show prompt after delay if installable
  useEffect(() => {
    if (!state.canShowPrompt || hasShownOnce) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasShownOnce(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [state.canShowPrompt, showAfterDelay, hasShownOnce]);

  // Auto-hide prompt after delay
  useEffect(() => {
    if (!isVisible || !autoHide) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [isVisible, autoHide, autoHideDelay]);

  // Handle install action
  const handleInstall = async () => {
    try {
      const success = await actions.triggerInstall();
      if (success) {
        setIsVisible(false);
        onInstallSuccess?.();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Installation failed';
      onInstallError?.(errorMessage);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    actions.dismissPrompt();
    setIsVisible(false);
    onDismiss?.();
  };

  // Handle close
  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render if not visible or can't show prompt
  if (!isVisible || !state.canShowPrompt) {
    return null;
  }

  // iOS Instructions Modal
  const IOSInstructionsModal = () => (
    <div className={styles.modalOverlay} onClick={actions.hideIOSInstructions}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className={styles.modalTitle}>Install App</h3>
          <p className={styles.modalSubtitle}>
            {iosInstructions.browserSpecific
              ? 'Follow these steps to install the app:'
              : 'Please open this page in Safari to install:'}
          </p>
        </div>

        <div className={styles.instructionsList}>
          {iosInstructions.steps.map((step, index) => (
            <div key={index} className={styles.instructionItem}>
              <div className={styles.instructionNumber}>{index + 1}</div>
              <div className={styles.instructionText}>{step}</div>
            </div>
          ))}
        </div>

        <div className={styles.modalActions}>
          <button
            className={`${styles.modalButton} ${styles.modalButtonSecondary}`}
            onClick={actions.hideIOSInstructions}
          >
            Got it
          </button>
          {!iosInstructions.browserSpecific && (
            <button
              className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
              onClick={() => {
                window.location.reload();
              }}
            >
              Open in Safari
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Card variant (default)
  if (variant === 'card') {
    return (
      <>
        <div className={styles.promptContainer}>
          <div className={styles.promptCard}>
            <div className={styles.promptHeader}>
              <div className={styles.promptIcon}>
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className={styles.promptContent}>
                <div className={styles.promptTitle}>Install App</div>
                <div className={styles.promptDescription}>
                  Get quick access and work offline. Install this app on your
                  device.
                </div>
              </div>
              <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Close install prompt"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.promptActions}>
              <button className={styles.dismissButton} onClick={handleDismiss}>
                Not now
              </button>
              <button
                className={styles.installButton}
                onClick={handleInstall}
                disabled={state.isInstalling}
              >
                {state.isInstalling ? 'Installing...' : 'Install'}
              </button>
            </div>
          </div>
        </div>
        {state.showIOSInstructions && <IOSInstructionsModal />}
      </>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <>
        <div className={styles.bannerContainer}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerText}>
              <div className={styles.bannerTitle}>
                Install Romanian ID Processor
              </div>
              <div className={styles.bannerDescription}>
                Get quick access and work offline
              </div>
            </div>
            <div className={styles.bannerActions}>
              <button
                className={`${styles.bannerButton} ${styles.bannerButtonSecondary}`}
                onClick={handleDismiss}
              >
                Dismiss
              </button>
              <button
                className={`${styles.bannerButton} ${styles.bannerButtonPrimary}`}
                onClick={handleInstall}
                disabled={state.isInstalling}
              >
                {state.isInstalling ? 'Installing...' : 'Install'}
              </button>
            </div>
          </div>
        </div>
        {state.showIOSInstructions && <IOSInstructionsModal />}
      </>
    );
  }

  // Minimal variant - just the install button
  if (variant === 'minimal') {
    return (
      <>
        <InstallButton
          isInstalling={state.isInstalling}
          onClick={handleInstall}
          variant="primary"
          size="md"
        >
          Install App
        </InstallButton>
        {state.showIOSInstructions && <IOSInstructionsModal />}
      </>
    );
  }

  return null;
}
