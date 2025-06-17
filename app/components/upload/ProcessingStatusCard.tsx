'use client';

import React from 'react';

interface ProcessingStatusCardProps {
  isProcessing: boolean;
  title?: string;
  description?: string;
  onCancel?: () => void;
  className?: string;
}

export default function ProcessingStatusCard({
  isProcessing,
  title = 'Processing...',
  description = 'Document is being analyzed using Artificial Intelligence',
  onCancel,
  className = '',
}: ProcessingStatusCardProps) {
  if (!isProcessing) return null;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}
    >
      <div className="animate-pulse">
        <div className="h-16 w-16 mx-auto bg-blue-200 rounded-full mb-4 flex items-center justify-center">
          <span className="text-blue-800 text-2xl">AI</span>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-100 text-red-800 font-medium rounded-lg hover:bg-red-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
