/**
 * Qwen AI Extraction Hook
 * React hook for integrating Qwen2.5-VL AI processing with the upload interface
 */

import { useState, useCallback, useRef } from 'react';
import { useProcessingProgress } from '@/lib/hooks/useProcessingProgress';
import type {
  RomanianIDExtractionResult,
  AIVisionOCRResponse,
  AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';
import {
  createAIProcessingFormData,
  processAIResponse,
} from '@/lib/utils/ai-integration-utils';

export interface QwenAIExtractionOptions {
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

export interface QwenAIExtractionState {
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

export interface QwenAIExtractionActions {
  /** Start AI extraction for a file */
  startExtraction: (
    _file: File,
    _options?: QwenAIExtractionOptions
  ) => Promise<void>;
  /** Cancel ongoing extraction */
  cancelExtraction: () => void;
  /** Reset extraction state */
  resetExtraction: () => void;
  /** Retry extraction with same file and options */
  retryExtraction: () => Promise<void>;
}

/**
 * Hook for Qwen AI extraction with progress tracking
 */
export function useQwenAIExtraction(): QwenAIExtractionState &
  QwenAIExtractionActions {
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
  const lastOptionsRef = useRef<QwenAIExtractionOptions | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Progress tracking
  const {
    progress: progressState,
    startProcessing,
    updateStage,
    updateProgress,
    cancelProcessing,
  } = useProcessingProgress({
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
    async (
      file: File,
      options: QwenAIExtractionOptions = {}
    ): Promise<void> => {
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
        const sessionId = `qwen-extraction-${Date.now()}`;
        const imageMetadata = {
          size: file.size,
          width: 1024, // Default assumption
          height: 768,
          format: file.type.split('/')[1] || 'jpeg',
          complexity: 1.0,
        };

        startProcessing(sessionId, imageMetadata);

        // Stage 1: Uploading
        updateStage('uploading', 0);
        options.onProgress?.(10);

        // Create form data
        const formData = createAIProcessingFormData(file, {
          ...(options.temperature !== undefined && {
            temperature: options.temperature,
          }),
          ...(options.max_tokens !== undefined && {
            max_tokens: options.max_tokens,
          }),
          ...(options.enhance_image !== undefined && {
            enhance_image: options.enhance_image,
          }),
          ...(options.custom_prompt !== undefined && {
            custom_prompt: options.custom_prompt,
          }),
        });

        updateProgress(100);
        updateStage('preprocessing', 0);
        options.onProgress?.(20);

        // Stage 2: Preprocessing
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate preprocessing
        updateProgress(100);
        updateStage('ai-analysis', 0);
        options.onProgress?.(30);

        // Stage 3: AI Analysis - Call the API
        const response = await fetch('/api/ai-vision-ocr', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: AIVisionOCRResponse = await response.json();

        updateProgress(100);
        updateStage('data-extraction', 0);
        options.onProgress?.(80);

        // Stage 4: Data Extraction - Process response
        const processedResponse = processAIResponse(apiResponse);

        if (!processedResponse.success || !processedResponse.data) {
          const errorInfo = processedResponse.error || {
            code: 'EXTRACTION_FAILED' as AIVisionErrorCode,
            message: 'Failed to extract data from image',
          };

          setError(errorInfo);
          options.onError?.(errorInfo);
          return;
        }

        updateProgress(100);
        updateStage('validation', 0);
        options.onProgress?.(90);

        // Stage 5: Validation
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate validation
        updateProgress(100);
        updateStage('completed', 100);
        options.onProgress?.(100);

        // Success
        setResult(processedResponse.data);
        setIsCompleted(true);
        options.onSuccess?.(processedResponse.data);
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          setIsCancelled(true);
          return;
        }

        console.error('AI extraction failed:', err);

        const errorInfo = {
          code: 'INTERNAL_ERROR' as AIVisionErrorCode,
          message:
            err instanceof Error ? err.message : 'Unknown error occurred',
        };

        setError(errorInfo);
        options.onError?.(errorInfo);
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
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
