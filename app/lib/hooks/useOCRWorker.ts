/**
 * React hook for OCR Worker integration
 * Provides easy-to-use state management and worker operations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  OCRResult,
  OCRProgress,
  OCRProcessingOptions,
  PreprocessingResult,
} from '../ocr/ocr-types';
import type { WorkerError } from '../workers/worker-error-handler';
import type { WorkerMetrics } from '../workers/worker-types';
import { ocrWorkerManager } from '../workers/ocr-worker-manager';
import { checkWorkerCompatibility } from '../workers/worker-utils';

// Hook state interface
export interface OCRWorkerState {
  isInitialized: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  currentJob: string | null;
  progress: OCRProgress | null;
  result: OCRResult | null;
  preprocessingResult: PreprocessingResult | null;
  error: WorkerError | null;
  metrics: WorkerMetrics | null;
}

// Hook options interface
export interface UseOCRWorkerOptions {
  autoInitialize?: boolean;
  enableMetrics?: boolean;
  onProgress?: (_progress: OCRProgress) => void;
  onResult?: (_result: OCRResult, _preprocessing?: PreprocessingResult) => void;
  onError?: (_error: WorkerError) => void;
  onInitialized?: () => void;
}

// Hook return interface
export interface UseOCRWorkerReturn {
  state: OCRWorkerState;
  processImage: (
    _imageInput: string | File | ImageData | HTMLCanvasElement,
    _options?: OCRProcessingOptions
  ) => Promise<string | null>;
  cancelProcessing: () => Promise<void>;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  getCompatibility: () => ReturnType<typeof checkWorkerCompatibility>;
  refreshMetrics: () => void;
}

/**
 * Custom hook for OCR Worker operations
 */
export function useOCRWorker(
  options: UseOCRWorkerOptions = {}
): UseOCRWorkerReturn {
  const {
    autoInitialize = true,
    enableMetrics = false,
    onProgress,
    onResult,
    onError,
    onInitialized,
  } = options;

  // State management
  const [state, setState] = useState<OCRWorkerState>(() => {
    const compatibility = checkWorkerCompatibility();
    return {
      isInitialized: false,
      isProcessing: false,
      isSupported: compatibility.isSupported,
      currentJob: null,
      progress: null,
      result: null,
      preprocessingResult: null,
      error: null,
      metrics: null,
    };
  });

  // Refs for cleanup and current job tracking
  const currentJobRef = useRef<string | null>(null);
  const isUnmountedRef = useRef(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<OCRWorkerState>) => {
    if (isUnmountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize worker manager
  const initialize = useCallback(async () => {
    if (!state.isSupported) {
      const error: WorkerError = {
        code: 'BROWSER_COMPATIBILITY_ERROR',
        message: 'Web Workers not supported',
        details: 'Your browser does not support Web Workers',
        recoverable: false,
        timestamp: new Date(),
        category: 'BROWSER_COMPATIBILITY' as any,
        severity: 'CRITICAL' as any,
        recoveryStrategy: 'FALLBACK_TO_MAIN_THREAD' as any,
      };
      updateState({ error });
      onError?.(error);
      return;
    }

    try {
      await ocrWorkerManager.initialize();
      updateState({
        isInitialized: true,
        error: null,
        metrics: enableMetrics ? ocrWorkerManager.getMetrics() : null,
      });
      onInitialized?.();
    } catch (error) {
      const workerError = error as WorkerError;
      updateState({ error: workerError, isInitialized: false });
      onError?.(workerError);
    }
  }, [state.isSupported, enableMetrics, onError, onInitialized, updateState]);

  // Process image with OCR
  const processImage = useCallback(
    async (
      imageInput: string | File | ImageData | HTMLCanvasElement,
      processingOptions: OCRProcessingOptions = { language: 'ron' }
    ): Promise<string | null> => {
      if (!state.isInitialized) {
        await initialize();
      }

      if (!state.isSupported) {
        return null;
      }

      if (state.isProcessing) {
        console.warn('OCR processing already in progress');
        return null;
      }

      try {
        updateState({
          isProcessing: true,
          error: null,
          progress: null,
          result: null,
          preprocessingResult: null,
        });

        const jobId = await ocrWorkerManager.processImage(
          imageInput,
          processingOptions,
          // Progress callback
          (progress: OCRProgress) => {
            updateState({ progress });
            onProgress?.(progress);
          },
          // Result callback
          (result: OCRResult, preprocessing?: PreprocessingResult) => {
            updateState({
              result,
              preprocessingResult: preprocessing || null,
              isProcessing: false,
              currentJob: null,
              metrics: enableMetrics ? ocrWorkerManager.getMetrics() : null,
            });
            currentJobRef.current = null;
            onResult?.(result, preprocessing);
          },
          // Error callback
          (error: WorkerError) => {
            updateState({
              error,
              isProcessing: false,
              currentJob: null,
              metrics: enableMetrics ? ocrWorkerManager.getMetrics() : null,
            });
            currentJobRef.current = null;
            onError?.(error);
          }
        );

        currentJobRef.current = jobId;
        updateState({ currentJob: jobId });

        return jobId;
      } catch (error) {
        const workerError = error as WorkerError;
        updateState({
          error: workerError,
          isProcessing: false,
          currentJob: null,
        });
        currentJobRef.current = null;
        onError?.(workerError);
        return null;
      }
    },
    [
      state.isInitialized,
      state.isSupported,
      state.isProcessing,
      initialize,
      enableMetrics,
      onProgress,
      onResult,
      onError,
      updateState,
    ]
  );

  // Cancel current processing
  const cancelProcessing = useCallback(async () => {
    if (currentJobRef.current) {
      // Note: Actual job cancellation would require additional implementation
      // in the worker manager to track and cancel specific jobs
      updateState({
        isProcessing: false,
        currentJob: null,
        progress: null,
      });
      currentJobRef.current = null;
    }
  }, [updateState]);

  // Cleanup resources
  const cleanup = useCallback(async () => {
    try {
      await ocrWorkerManager.cleanup();
      updateState({
        isInitialized: false,
        isProcessing: false,
        currentJob: null,
        progress: null,
        result: null,
        preprocessingResult: null,
        error: null,
        metrics: null,
      });
      currentJobRef.current = null;
    } catch (error) {
      console.error('Failed to cleanup OCR worker:', error);
    }
  }, [updateState]);

  // Get compatibility information
  const getCompatibility = useCallback(() => {
    return checkWorkerCompatibility();
  }, []);

  // Refresh metrics
  const refreshMetrics = useCallback(() => {
    if (enableMetrics && state.isInitialized) {
      updateState({ metrics: ocrWorkerManager.getMetrics() });
    }
  }, [enableMetrics, state.isInitialized, updateState]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && state.isSupported && !state.isInitialized) {
      initialize();
    }
  }, [autoInitialize, state.isSupported, state.isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (currentJobRef.current) {
        // Cancel any ongoing processing
        currentJobRef.current = null;
      }
    };
  }, []);

  // Periodic metrics refresh
  useEffect(() => {
    if (!enableMetrics || !state.isInitialized) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [enableMetrics, state.isInitialized, refreshMetrics]);

  return {
    state,
    processImage,
    cancelProcessing,
    initialize,
    cleanup,
    getCompatibility,
    refreshMetrics,
  };
}

/**
 * Hook for simple OCR processing without advanced features
 */
export function useSimpleOCR(
  options: Omit<UseOCRWorkerOptions, 'enableMetrics'> = {}
) {
  return useOCRWorker({ ...options, enableMetrics: false });
}

/**
 * Hook for OCR processing with full metrics and monitoring
 */
export function useAdvancedOCR(options: UseOCRWorkerOptions = {}) {
  return useOCRWorker({ ...options, enableMetrics: true });
}

/**
 * Hook for Romanian ID processing specifically
 */
export function useRomanianIDOCR(options: UseOCRWorkerOptions = {}) {
  const defaultOptions: OCRProcessingOptions = {
    language: 'ron',
    preprocessImage: true,
    enhanceContrast: true,
    removeNoise: true,
    convertToGrayscale: true,
    confidenceThreshold: 60,
  };

  const ocrHook = useOCRWorker(options);

  const processRomanianID = useCallback(
    async (
      imageInput: string | File | ImageData | HTMLCanvasElement,
      customOptions?: Partial<OCRProcessingOptions>
    ) => {
      const mergedOptions = { ...defaultOptions, ...customOptions };
      return ocrHook.processImage(imageInput, mergedOptions);
    },
    [ocrHook]
  );

  return {
    ...ocrHook,
    processRomanianID,
  };
}
