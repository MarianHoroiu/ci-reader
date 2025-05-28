/**
 * AI Extraction Hook
 * React hook for integrating AI processing with the upload interface
 */

import { useState, useCallback, useRef } from 'react';
import { useProcessingProgress } from '@/lib/hooks/useProcessingProgress';
import type { ProcessingStage } from '@/lib/types/progress-types';
import { isValidErrorCode } from '@/lib/types/romanian-id-types';
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
  /** Callback for progress updates */
  onProgress?: (_progress: number) => void;
}

export interface AIExtractionState {
  /** Whether AI processing is currently running */
  isProcessing: boolean;
  /** Current processing progress (0-100) */
  progress: number;
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
 * Helper function to create form data for API request
 */
function createAPIFormData(
  file: File,
  options: AIExtractionOptions = {}
): FormData {
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

  return formData;
}

/**
 * Get API base URL with protocol
 */
function getAPIBaseURL(): string {
  const isSecure = window.location.protocol === 'https:';
  return `${isSecure ? 'https' : 'http'}://${window.location.host}`;
}

/**
 * Process API response to extract result or error
 */
function processAPIResponse(response: AIVisionOCRResponse): {
  success: boolean;
  data?: RomanianIDExtractionResult;
  error?: {
    code: AIVisionErrorCode;
    message: string;
  };
} {
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  // Make sure the error code is a valid AIVisionErrorCode
  const errorCode = response.error?.code
    ? isValidErrorCode(response.error.code)
      ? response.error.code
      : ('INTERNAL_ERROR' as AIVisionErrorCode)
    : ('INTERNAL_ERROR' as AIVisionErrorCode);

  return {
    success: false,
    error: {
      code: errorCode,
      message:
        response.error?.message || 'Unknown error occurred during processing',
    },
  };
}

/**
 * Hook for AI extraction with progress tracking
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

  // Progress tracking
  const {
    progress: progressState,
    startProcessing,
    updateStage,
    updateProgress,
    cancelProcessing,
  } = useProcessingProgress({
    autoStart: false,
    onComplete: () => {
      setIsCompleted(true);
      setIsProcessing(false);
    },
    onError: progressError => {
      console.error('Progress tracking error:', progressError);
    },
    onCancel: () => {
      setIsCancelled(true);
      setIsProcessing(false);
    },
  });

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
        // Start progress tracking
        const sessionId = `ai-extraction-${Date.now()}`;
        startProcessing(sessionId, {
          size: file.size,
          width: 1024, // Default values
          height: 768,
          format: file.type.split('/')[1] || 'jpeg',
          complexity: 1.0,
        });

        // Stage 1: File preparation
        updateStage('uploading' as ProcessingStage, 0);
        options.onProgress?.(10);

        // Create form data
        const formData = createAPIFormData(file, options);
        updateProgress(100);
        options.onProgress?.(20);

        // Stage 2: AI processing
        updateStage('ai-analysis' as ProcessingStage, 0);

        // Update progress during AI processing
        let progressCounter = 0;
        const progressInterval = setInterval(() => {
          progressCounter += 5;
          if (progressCounter <= 90) {
            updateProgress(progressCounter);
            options.onProgress?.(20 + progressCounter * 0.7);
          }
        }, 500);

        // Make API call
        const apiBaseURL = getAPIBaseURL();
        const response = await fetch(`${apiBaseURL}/api/ai-vision-ocr`, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        clearInterval(progressInterval);
        updateProgress(100);
        options.onProgress?.(90);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const apiResponse: AIVisionOCRResponse = await response.json();

        // Stage 3: Finalizing
        updateStage('data-extraction' as ProcessingStage, 0);

        // Process the response
        const processedResponse = processAPIResponse(apiResponse);

        if (!processedResponse.success || !processedResponse.data) {
          const errorInfo = processedResponse.error || {
            code: 'EXTRACTION_FAILED' as AIVisionErrorCode,
            message: 'Failed to extract data from image',
          };

          setError(errorInfo);
          options.onError?.(errorInfo);
          updateProgress(100);
          return;
        }

        // Success
        updateProgress(100);
        options.onProgress?.(100);

        // Final stage: Completed
        updateStage('completed' as ProcessingStage, 100);

        setResult(processedResponse.data);
        setIsCompleted(true);
        options.onSuccess?.(processedResponse.data);
      } catch (error) {
        console.error('AI extraction error:', error);

        // Handle cancellation
        if (error instanceof Error && error.name === 'AbortError') {
          setIsCancelled(true);
          setIsProcessing(false);
          return;
        }

        // Handle other errors
        setError({
          code: 'INTERNAL_ERROR' as AIVisionErrorCode,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });

        options.onError?.({
          code: 'INTERNAL_ERROR' as AIVisionErrorCode,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });

        setIsProcessing(false);
      }
    },
    [startProcessing, updateStage, updateProgress]
  );

  /**
   * Cancel ongoing extraction
   */
  const cancelExtraction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cancelProcessing();
    setIsCancelled(true);
    setIsProcessing(false);
  }, [cancelProcessing]);

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
    progress: progressState?.overallProgress || 0,
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
