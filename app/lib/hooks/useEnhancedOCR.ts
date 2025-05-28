/**
 * Enhanced OCR Hook with Image Preprocessing
 * Combines client-side image preprocessing with server-side OCR
 * for maximum Romanian ID recognition accuracy
 */

import { useState, useCallback } from 'react';
import { useRomanianIDServerOCR } from './useServerOCR';
import {
  RomanianIDPreprocessor,
  ROMANIAN_ID_OPTIMAL_SETTINGS,
  type PreprocessingSettings,
  type ProcessedImageResult,
} from '../image-processing/romanian-id-preprocessor';

interface UseEnhancedOCROptions {
  enablePreprocessing?: boolean;
  preprocessingSettings?: PreprocessingSettings;
  onPreprocessingComplete?: (_result: ProcessedImageResult) => void;
  onPreprocessingError?: (_error: Error) => void;
}

export function useEnhancedOCR(options: UseEnhancedOCROptions = {}) {
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessedImage, setPreprocessedImage] =
    useState<ProcessedImageResult | null>(null);
  const [preprocessingError, setPreprocessingError] = useState<Error | null>(
    null
  );

  const {
    enablePreprocessing = true,
    preprocessingSettings = ROMANIAN_ID_OPTIMAL_SETTINGS,
    onPreprocessingComplete,
    onPreprocessingError,
  } = options;

  // Use our existing server OCR hook
  const serverOCR = useRomanianIDServerOCR();

  // Initialize preprocessor (only on client side)
  const [preprocessor] = useState(() => {
    if (typeof window !== 'undefined') {
      return new RomanianIDPreprocessor();
    }
    return null;
  });

  const processRomanianIDWithPreprocessing = useCallback(
    async (imageFile: File) => {
      // Reset all state before processing new image
      setPreprocessingError(null);
      setPreprocessedImage(null);
      serverOCR.reset(); // Reset the underlying OCR state

      try {
        if (enablePreprocessing && preprocessor) {
          console.log('Starting image preprocessing for enhanced OCR...');
          setIsPreprocessing(true);

          // Step 1: Preprocess the image
          const preprocessedResult = await preprocessor.processImage(
            imageFile,
            preprocessingSettings
          );

          console.log('Image preprocessing completed:', {
            originalSize: `${imageFile.size} bytes`,
            processedSize: `${preprocessedResult.width}x${preprocessedResult.height}`,
            settings: preprocessedResult.settings,
          });

          setPreprocessedImage(preprocessedResult);
          onPreprocessingComplete?.(preprocessedResult);

          // Step 2: Send preprocessed image to OCR
          await serverOCR.processRomanianID(preprocessedResult.dataUrl);
        } else {
          // Fallback: Use original image without preprocessing
          console.log('Preprocessing disabled, using original image...');
          const reader = new FileReader();
          reader.onload = async e => {
            const imageData = e.target?.result as string;
            if (imageData) {
              await serverOCR.processRomanianID(imageData);
            }
          };
          reader.readAsDataURL(imageFile);
        }
      } catch (error) {
        const processingError =
          error instanceof Error ? error : new Error(String(error));
        console.error('Image preprocessing failed:', processingError);
        setPreprocessingError(processingError);
        onPreprocessingError?.(processingError);

        // Fallback: Try with original image
        console.log('Falling back to original image...');
        try {
          const reader = new FileReader();
          reader.onload = async e => {
            const imageData = e.target?.result as string;
            if (imageData) {
              await serverOCR.processRomanianID(imageData);
            }
          };
          reader.readAsDataURL(imageFile);
        } catch (fallbackError) {
          console.error('Fallback OCR also failed:', fallbackError);
        }
      } finally {
        setIsPreprocessing(false);
      }
    },
    [
      enablePreprocessing,
      preprocessor,
      preprocessingSettings,
      serverOCR,
      onPreprocessingComplete,
      onPreprocessingError,
    ]
  );

  const processImageFromDataUrl = useCallback(
    async (dataUrl: string) => {
      // Reset all state before processing new image
      setPreprocessingError(null);
      setPreprocessedImage(null);
      serverOCR.reset(); // Reset the underlying OCR state

      try {
        if (enablePreprocessing && preprocessor) {
          console.log('Starting preprocessing from data URL...');
          setIsPreprocessing(true);

          const preprocessedResult = await preprocessor.processImageFromDataUrl(
            dataUrl,
            preprocessingSettings
          );

          setPreprocessedImage(preprocessedResult);
          onPreprocessingComplete?.(preprocessedResult);

          await serverOCR.processRomanianID(preprocessedResult.dataUrl);
        } else {
          await serverOCR.processRomanianID(dataUrl);
        }
      } catch (error) {
        const processingError =
          error instanceof Error ? error : new Error(String(error));
        setPreprocessingError(processingError);
        onPreprocessingError?.(processingError);

        // Fallback to original
        await serverOCR.processRomanianID(dataUrl);
      } finally {
        setIsPreprocessing(false);
      }
    },
    [
      enablePreprocessing,
      preprocessor,
      preprocessingSettings,
      serverOCR,
      onPreprocessingComplete,
      onPreprocessingError,
    ]
  );

  const getPreprocessingPreview = useCallback(
    async (
      dataUrl: string,
      settings?: PreprocessingSettings
    ): Promise<string | null> => {
      if (!preprocessor) return null;

      try {
        return await preprocessor.getPreview(
          dataUrl,
          settings || preprocessingSettings,
          400
        );
      } catch (error) {
        console.error('Failed to generate preprocessing preview:', error);
        return null;
      }
    },
    [preprocessor, preprocessingSettings]
  );

  const resetEnhancedOCR = useCallback(() => {
    console.log('🔄 Resetting enhanced OCR state...');
    setPreprocessingError(null);
    setPreprocessedImage(null);
    setIsPreprocessing(false);
    serverOCR.reset();
  }, [serverOCR]);

  return {
    // OCR functionality
    ...serverOCR,
    processRomanianIDWithPreprocessing,
    processImageFromDataUrl,
    reset: resetEnhancedOCR, // Override the reset function

    // Preprocessing state
    isPreprocessing,
    preprocessedImage,
    preprocessingError,
    getPreprocessingPreview,

    // Settings
    preprocessingSettings,
    enablePreprocessing,
  };
}

/**
 * Hook specifically for Romanian ID processing with optimal settings
 */
export function useRomanianIDEnhancedOCR() {
  return useEnhancedOCR({
    enablePreprocessing: true,
    preprocessingSettings: ROMANIAN_ID_OPTIMAL_SETTINGS,
  });
}
