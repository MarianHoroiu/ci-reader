'use client';

import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { getBrowserInstallInstructions } from '../../lib/pwa-utils';
import InstallButton from '../components/InstallButton';

export default function TestInstallPage() {
  const { state, actions } = useInstallPrompt();
  const browserInstructions = getBrowserInstallInstructions();

  const handleInstall = async () => {
    const success = await actions.triggerInstall();
    console.log('Install result:', success);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            PWA Install Test Page
          </h1>

          {/* Browser Detection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Browser Detection
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Platform:</span>{' '}
                  {state.capabilities.platform}
                </div>
                <div>
                  <span className="font-medium">Browser:</span>{' '}
                  {state.capabilities.browser}
                </div>
                <div>
                  <span className="font-medium">Can Install:</span>{' '}
                  <span
                    className={
                      state.capabilities.canInstall
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {state.capabilities.canInstall ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">
                    Supports beforeinstallprompt:
                  </span>{' '}
                  <span
                    className={
                      state.capabilities.supportsBeforeInstallPrompt
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {state.capabilities.supportsBeforeInstallPrompt
                      ? '✅ Yes'
                      : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Is Standalone:</span>{' '}
                  <span
                    className={
                      state.capabilities.isStandalone
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }
                  >
                    {state.capabilities.isStandalone ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Is Installed:</span>{' '}
                  <span
                    className={
                      state.capabilities.isInstalled
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }
                  >
                    {state.capabilities.isInstalled ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Install State */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Install State
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Can Show Prompt:</span>{' '}
                  <span
                    className={
                      state.canShowPrompt ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {state.canShowPrompt ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Is Installing:</span>{' '}
                  <span
                    className={
                      state.isInstalling ? 'text-yellow-600' : 'text-gray-600'
                    }
                  >
                    {state.isInstalling ? '⏳ Yes' : '❌ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Has Been Dismissed:</span>{' '}
                  <span
                    className={
                      state.hasBeenDismissed ? 'text-red-600' : 'text-green-600'
                    }
                  >
                    {state.hasBeenDismissed ? '❌ Yes' : '✅ No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Show iOS Instructions:</span>{' '}
                  <span
                    className={
                      state.showIOSInstructions
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }
                  >
                    {state.showIOSInstructions ? '📱 Yes' : '❌ No'}
                  </span>
                </div>
              </div>
              {state.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <span className="font-medium">Error:</span> {state.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Browser Instructions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Browser-Specific Instructions
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <span className="font-medium">Can Install:</span>{' '}
                <span
                  className={
                    browserInstructions.canInstall
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {browserInstructions.canInstall ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="mb-3">
                <span className="font-medium">Browser Specific:</span>{' '}
                <span
                  className={
                    browserInstructions.browserSpecific
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }
                >
                  {browserInstructions.browserSpecific ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Instructions:</span>
                <ol className="mt-2 space-y-1 text-sm">
                  {browserInstructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-2 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Install Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Install Actions
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <InstallButton
                  onClick={handleInstall}
                  isInstalling={state.isInstalling}
                  disabled={!state.capabilities.canInstall}
                >
                  {state.capabilities.browser === 'arc'
                    ? 'Arc Browser (Not Supported)'
                    : 'Install App'}
                </InstallButton>

                <button
                  onClick={actions.showIOSInstructions}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Show Instructions
                </button>

                <button
                  onClick={actions.dismissPrompt}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Dismiss Prompt
                </button>

                <button
                  onClick={actions.resetDismissal}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Reset Dismissal
                </button>
              </div>
            </div>
          </div>

          {/* Arc Browser Specific Message */}
          {state.capabilities.browser === 'arc' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Arc Browser Detected
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Arc browser currently does not support PWA installation,
                      even though it has the beforeinstallprompt event. Please
                      try using Chrome, Edge, or Safari for the full PWA
                      experience.
                    </p>
                    <p className="mt-2">
                      <a
                        href="https://intercom.help/progressier/en/articles/8607063-does-the-arc-browser-support-pwa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:text-yellow-600"
                      >
                        Learn more about Arc browser PWA support →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
