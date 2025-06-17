'use client';

import { useState, useCallback } from 'react';

export type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';

export interface ProcessingStatus {
  state: ProcessingState;
  progress: number;
  message: string;
  error?: string | null;
  result?: any;
}

export interface UseProcessingStatusOptions {
  initialMessage?: string;
  onStateChange?: (_state: ProcessingState) => void;
  onComplete?: (_result: any) => void;
  onError?: (_error: string) => void;
}

export interface UseProcessingStatusReturn {
  status: ProcessingStatus;
  startProcessing: (_message?: string) => void;
  setProgress: (_progress: number, _message?: string) => void;
  completeProcessing: (_result?: any, _message?: string) => void;
  setError: (_error: string) => void;
  reset: () => void;
  isProcessing: boolean;
  isCompleted: boolean;
  hasError: boolean;
}

export function useProcessingStatus(
  options: UseProcessingStatusOptions = {}
): UseProcessingStatusReturn {
  const {
    initialMessage = 'Ready to process',
    onStateChange,
    onComplete,
    onError,
  } = options;

  const [status, setStatus] = useState<ProcessingStatus>({
    state: 'idle',
    progress: 0,
    message: initialMessage,
  });

  const updateStatus = useCallback(
    (updates: Partial<ProcessingStatus>) => {
      setStatus(prev => {
        const newStatus = { ...prev, ...updates };

        // Notify state change
        if (updates.state && updates.state !== prev.state) {
          onStateChange?.(updates.state);
        }

        return newStatus;
      });
    },
    [onStateChange]
  );

  const startProcessing = useCallback(
    (message = 'Processing...') => {
      updateStatus({
        state: 'processing',
        progress: 0,
        message,
        error: null,
        result: null,
      });
    },
    [updateStatus]
  );

  const setProgress = useCallback(
    (progress: number, message?: string) => {
      updateStatus({
        progress: Math.max(0, Math.min(100, progress)),
        ...(message && { message }),
      });
    },
    [updateStatus]
  );

  const completeProcessing = useCallback(
    (result?: any, message = 'Processing completed') => {
      updateStatus({
        state: 'completed',
        progress: 100,
        message,
        result,
        error: null,
      });

      onComplete?.(result);
    },
    [updateStatus, onComplete]
  );

  const setError = useCallback(
    (error: string) => {
      updateStatus({
        state: 'error',
        message: 'Processing failed',
        error,
        result: null,
      });

      onError?.(error);
    },
    [updateStatus, onError]
  );

  const reset = useCallback(() => {
    updateStatus({
      state: 'idle',
      progress: 0,
      message: initialMessage,
      error: null,
      result: null,
    });
  }, [updateStatus, initialMessage]);

  // Derived state
  const isProcessing = status.state === 'processing';
  const isCompleted = status.state === 'completed';
  const hasError = status.state === 'error';

  return {
    status,
    startProcessing,
    setProgress,
    completeProcessing,
    setError,
    reset,
    isProcessing,
    isCompleted,
    hasError,
  };
}
