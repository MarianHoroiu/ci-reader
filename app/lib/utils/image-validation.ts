/**
 * Image Validation Utilities
 * Validates images for Romanian ID processing pipeline
 */

import type {
  ImageValidationResult,
  ImageMetadata,
  SupportedImageFormat,
  ImageProcessingError,
} from '@/lib/types/image-processing-types';

/**
 * Supported image MIME types
 */
export const SUPPORTED_FORMATS: SupportedImageFormat[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

/**
 * Image validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 8000,
  MAX_HEIGHT: 6000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 1024, // 1KB
  SUPPORTED_ASPECT_RATIOS: {
    MIN: 0.5, // Very tall images
    MAX: 3.0, // Very wide images
  },
} as const;

/**
 * Create an image processing error
 */
export function createImageProcessingError(
  message: string,
  code: string,
  details?: any,
  recoverable = false
): ImageProcessingError {
  const error = new Error(message) as ImageProcessingError;
  error.code = code;
  error.details = details;
  error.recoverable = recoverable;
  return error;
}

/**
 * Validate file format
 */
export function validateFileFormat(file: File): string[] {
  const errors: string[] = [];

  if (!file.type) {
    errors.push('File type could not be determined');
    return errors;
  }

  if (!SUPPORTED_FORMATS.includes(file.type as SupportedImageFormat)) {
    errors.push(
      `Unsupported file format: ${file.type}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }

  return errors;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): string[] {
  const errors: string[] = [];

  if (file.size < VALIDATION_CONSTRAINTS.MIN_FILE_SIZE) {
    errors.push(
      `File too small: ${file.size} bytes. Minimum: ${VALIDATION_CONSTRAINTS.MIN_FILE_SIZE} bytes`
    );
  }

  if (file.size > VALIDATION_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.push(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: ${
        VALIDATION_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024
      }MB`
    );
  }

  return errors;
}

/**
 * Extract image metadata from file
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Create canvas to check color depth and alpha
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(
          createImageProcessingError(
            'Could not create canvas context',
            'CANVAS_ERROR'
          )
        );
        return;
      }

      canvas.width = Math.min(img.width, 100); // Sample small area for efficiency
      canvas.height = Math.min(img.height, 100);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasAlpha = checkForAlphaChannel(imageData);

        resolve({
          width: img.width,
          height: img.height,
          fileSize: file.size,
          format: file.type,
          colorDepth: hasAlpha ? 32 : 24, // Simplified assumption
          hasAlpha,
          aspectRatio: img.width / img.height,
        });
      } catch (error) {
        reject(
          createImageProcessingError(
            'Could not analyze image data',
            'IMAGE_ANALYSIS_ERROR',
            error
          )
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        createImageProcessingError('Could not load image', 'IMAGE_LOAD_ERROR')
      );
    };

    img.src = url;
  });
}

/**
 * Check for alpha channel in image data
 */
function checkForAlphaChannel(imageData: ImageData): boolean {
  const data = imageData.data;

  if (!data || data.length === 0) {
    return false;
  }

  // Check every 4th byte (alpha channel) for non-255 values
  for (let i = 3; i < data.length; i += 4) {
    const alphaValue = data[i];
    if (alphaValue !== undefined && alphaValue < 255) {
      return true;
    }
  }

  return false;
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(metadata: ImageMetadata): string[] {
  const errors: string[] = [];

  // Check minimum dimensions
  if (metadata.width < VALIDATION_CONSTRAINTS.MIN_WIDTH) {
    errors.push(
      `Image width too small: ${metadata.width}px. Minimum: ${VALIDATION_CONSTRAINTS.MIN_WIDTH}px`
    );
  }

  if (metadata.height < VALIDATION_CONSTRAINTS.MIN_HEIGHT) {
    errors.push(
      `Image height too small: ${metadata.height}px. Minimum: ${VALIDATION_CONSTRAINTS.MIN_HEIGHT}px`
    );
  }

  // Check maximum dimensions (these are warnings, but we'll include them in errors for now)
  if (metadata.width > VALIDATION_CONSTRAINTS.MAX_WIDTH) {
    errors.push(
      `Image width very large: ${metadata.width}px. May impact performance.`
    );
  }

  if (metadata.height > VALIDATION_CONSTRAINTS.MAX_HEIGHT) {
    errors.push(
      `Image height very large: ${metadata.height}px. May impact performance.`
    );
  }

  // Check aspect ratio
  const { aspectRatio } = metadata;
  if (aspectRatio < VALIDATION_CONSTRAINTS.SUPPORTED_ASPECT_RATIOS.MIN) {
    errors.push(
      `Unusual aspect ratio: ${aspectRatio.toFixed(2)}. Image is very tall.`
    );
  }

  if (aspectRatio > VALIDATION_CONSTRAINTS.SUPPORTED_ASPECT_RATIOS.MAX) {
    errors.push(
      `Unusual aspect ratio: ${aspectRatio.toFixed(2)}. Image is very wide.`
    );
  }

  return errors;
}

/**
 * Validate image for Romanian ID processing
 */
export function validateForRomanianID(metadata: ImageMetadata): string[] {
  const warnings: string[] = [];

  // Romanian ID cards are typically landscape orientation
  if (metadata.aspectRatio < 1.0) {
    warnings.push(
      'Image appears to be in portrait orientation. Romanian ID cards are typically landscape.'
    );
  }

  // Optimal aspect ratio for Romanian ID is approximately 1.6:1
  const idealAspectRatio = 1.6;
  const aspectRatioDiff = Math.abs(metadata.aspectRatio - idealAspectRatio);

  if (aspectRatioDiff > 0.5) {
    warnings.push(
      `Aspect ratio (${metadata.aspectRatio.toFixed(2)}) differs significantly from typical Romanian ID card ratio (${idealAspectRatio})`
    );
  }

  // Check for sufficient resolution for text recognition
  const pixelCount = metadata.width * metadata.height;
  const minPixelsForOCR = 500 * 300; // Minimum for decent OCR

  if (pixelCount < minPixelsForOCR) {
    warnings.push(
      'Image resolution may be too low for accurate text recognition'
    );
  }

  return warnings;
}

/**
 * Comprehensive image validation
 */
export async function validateImage(
  file: File
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate file format
    errors.push(...validateFileFormat(file));

    // Validate file size
    errors.push(...validateFileSize(file));

    // If basic validation fails, return early
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          width: 0,
          height: 0,
          fileSize: file.size,
          format: file.type,
          colorDepth: 0,
          hasAlpha: false,
          aspectRatio: 0,
        },
      };
    }

    // Extract metadata
    const metadata = await extractImageMetadata(file);

    // Validate dimensions
    errors.push(...validateImageDimensions(metadata));

    // Romanian ID specific validation
    warnings.push(...validateForRomanianID(metadata));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  } catch (error) {
    const processingError = error as ImageProcessingError;

    return {
      isValid: false,
      errors: [processingError.message || 'Unknown validation error'],
      warnings,
      metadata: {
        width: 0,
        height: 0,
        fileSize: file.size,
        format: file.type,
        colorDepth: 0,
        hasAlpha: false,
        aspectRatio: 0,
      },
    };
  }
}

/**
 * Quick validation for file upload
 */
export function quickValidateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type as SupportedImageFormat)) {
    return {
      isValid: false,
      error: `Unsupported file format: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > VALIDATION_CONSTRAINTS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: ${
        VALIDATION_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024
      }MB`,
    };
  }

  if (file.size < VALIDATION_CONSTRAINTS.MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File too small',
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple files
 */
export async function validateMultipleImages(
  files: File[]
): Promise<ImageValidationResult[]> {
  const validationPromises = files.map(file => validateImage(file));
  return Promise.all(validationPromises);
}
