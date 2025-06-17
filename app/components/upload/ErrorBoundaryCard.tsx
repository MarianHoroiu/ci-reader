'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryCardProps {
  error: string | Error;
  onRetry?: () => void;
  onReset?: () => void;
  title?: string;
  className?: string;
}

export default function ErrorBoundaryCard({
  error,
  onRetry,
  onReset,
  title = 'Processing Error',
  className = '',
}: ErrorBoundaryCardProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start">
        <AlertTriangle className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
          <p className="text-red-700 mb-4">{errorMessage}</p>

          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 font-medium rounded-lg hover:bg-red-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
