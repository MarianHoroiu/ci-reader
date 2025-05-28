/**
 * Simplified AI Extraction Hook
 * Straightforward hook for uploading images and extracting Romanian ID data
 */

import { useState, useCallback, useRef } from 'react';
import type {
  RomanianIDExtractionResult,
  AIVisionOCRResponse,
  AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';

export interface AIExtractionOptions {
  /** Temperature for AI model (0-1) */
  temperature?: number;
  /** Maximum tokens for response */
  max_tokens?: number;
  /** Enable enhanced preprocessing */
  enhance_image?: boolean;
  /** Custom extraction prompt */
  custom_prompt?: string;
  /** Callback when extraction completes successfully */
  onSuccess?: (_result: RomanianIDExtractionResult) => void;
  /** Callback when extraction fails */
  onError?: (_error: { code: AIVisionErrorCode; message: string }) => void;
}

export interface AIExtractionState {
  /** Whether AI processing is currently running */
  isProcessing: boolean;
  /** Extraction result if successful */
  result: RomanianIDExtractionResult | null;
  /** Error information if processing failed */
  error: { code: AIVisionErrorCode; message: string } | null;
  /** Whether processing was cancelled */
  isCancelled: boolean;
  /** Whether processing completed successfully */
  isCompleted: boolean;
}

export interface AIExtractionActions {
  /** Start AI extraction for a file */
  startExtraction: (
    _file: File,
    _options?: AIExtractionOptions
  ) => Promise<void>;
  /** Cancel ongoing extraction */
  cancelExtraction: () => void;
  /** Reset extraction state */
  resetExtraction: () => void;
  /** Retry extraction with same file and options */
  retryExtraction: () => Promise<void>;
}

/**
 * Simplified hook for AI extraction without complex progress tracking
 */
export function useAIExtraction(): AIExtractionState & AIExtractionActions {
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RomanianIDExtractionResult | null>(null);
  const [error, setError] = useState<{
    code: AIVisionErrorCode;
    message: string;
  } | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Refs for retry functionality
  const lastFileRef = useRef<File | null>(null);
  const lastOptionsRef = useRef<AIExtractionOptions | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start AI extraction process
   */
  const startExtraction = useCallback(
    async (file: File, options: AIExtractionOptions = {}): Promise<void> => {
      // Reset state
      setIsProcessing(true);
      setResult(null);
      setError(null);
      setIsCancelled(false);
      setIsCompleted(false);

      // Store for retry
      lastFileRef.current = file;
      lastOptionsRef.current = options;

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Create form data
        const formData = new FormData();
        formData.append('image', file);

        if (options.temperature !== undefined) {
          formData.append('temperature', options.temperature.toString());
        }

        if (options.max_tokens !== undefined) {
          formData.append('max_tokens', options.max_tokens.toString());
        }

        if (options.enhance_image !== undefined) {
          formData.append('enhance_image', options.enhance_image.toString());
        }

        if (options.custom_prompt !== undefined) {
          formData.append('custom_prompt', options.custom_prompt);
        }

        // Get API base URL
        const isSecure = window.location.protocol === 'https:';
        const apiBaseURL = `${isSecure ? 'https' : 'http'}://${window.location.host}`;

        // Make API call
        const response = await fetch(`${apiBaseURL}/api/ai-vision-ocr`, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        // Process the response
        const apiResponse: AIVisionOCRResponse = await response.json();

        if (apiResponse.success && apiResponse.data) {
          setResult(apiResponse.data);
          setIsCompleted(true);
          options.onSuccess?.(apiResponse.data);
        } else {
          // Handle error response
          const errorCode =
            (apiResponse.error?.code as AIVisionErrorCode) ||
            ('EXTRACTION_FAILED' as AIVisionErrorCode);

          const errorInfo = {
            code: errorCode,
            message:
              apiResponse.error?.message || 'Failed to extract data from image',
          };

          setError(errorInfo);
          options.onError?.(errorInfo);
        }
      } catch (error) {
        // Handle cancellation
        if (error instanceof Error && error.name === 'AbortError') {
          setIsCancelled(true);
          setIsProcessing(false);
          return;
        }

        // Handle other errors
        const errorInfo = {
          code: 'INTERNAL_ERROR' as AIVisionErrorCode,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };

        setError(errorInfo);
        options.onError?.(errorInfo);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Cancel ongoing extraction
   */
  const cancelExtraction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Reset extraction state
   */
  const resetExtraction = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
    setIsCancelled(false);
    setIsCompleted(false);
    lastFileRef.current = null;
    lastOptionsRef.current = undefined;
  }, []);

  /**
   * Retry extraction with same parameters
   */
  const retryExtraction = useCallback(async (): Promise<void> => {
    if (!lastFileRef.current) {
      throw new Error('No previous extraction to retry');
    }

    // Call startExtraction with stored parameters
    await startExtraction(lastFileRef.current, lastOptionsRef.current);
  }, [startExtraction]);

  return {
    // State
    isProcessing,
    result,
    error,
    isCancelled,
    isCompleted,

    // Actions
    startExtraction,
    cancelExtraction,
    resetExtraction,
    retryExtraction,
  };
}
