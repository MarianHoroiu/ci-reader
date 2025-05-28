/**
 * Image validation for AI vision processing
 * Extends existing file validation with AI-specific requirements
 */

import {
  validateFile,
  type FileValidationResult,
} from '@/lib/validation/file-type-validator';
import {
  AI_VISION_ERROR_CODES,
  type AIVisionErrorCode,
  type ImageProcessingOptions,
} from '@/lib/types/romanian-id-types';

// AI-specific validation constraints
export const AI_IMAGE_CONSTRAINTS = {
  // Maximum file size for AI processing (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // Minimum dimensions for reliable OCR
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  // Maximum dimensions to prevent memory issues
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  // Supported formats for AI processing
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  // Minimum file size to ensure it's not empty/corrupted
  MIN_FILE_SIZE: 1024, // 1KB
} as const;

export interface AIImageValidationResult {
  /** Whether the image is valid for AI processing */
  isValid: boolean;
  /** Error code if validation failed */
  errorCode?: AIVisionErrorCode;
  /** Human-readable error message */
  errorMessage?: string;
  /** Image dimensions if available */
  dimensions?: {
    width: number;
    height: number;
  };
  /** File size in bytes */
  fileSize: number;
  /** Detected MIME type */
  mimeType: string;
  /** Additional validation details */
  details?: {
    /** Basic file validation result */
    fileValidation: FileValidationResult;
    /** AI-specific validation issues */
    aiValidationIssues: string[];
    /** Recommendations for improvement */
    recommendations: string[];
  };
}

/**
 * Validates an image file for AI vision processing
 */
export async function validateImageForAI(
  file: File
): Promise<AIImageValidationResult> {
  // Start with basic file validation
  const fileValidation = await validateFile(file);

  const result: AIImageValidationResult = {
    isValid: false,
    fileSize: file.size,
    mimeType: file.type,
    details: {
      fileValidation,
      aiValidationIssues: [],
      recommendations: [],
    },
  };

  // Check basic file validation first
  if (!fileValidation.isValid) {
    result.errorCode = mapFileValidationError(fileValidation.errorCode);
    result.errorMessage = fileValidation.error || 'File validation failed';
    return result;
  }

  // AI-specific validations
  const aiIssues: string[] = [];
  const recommendations: string[] = [];

  // Check file size constraints
  if (file.size > AI_IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
    result.errorCode = AI_VISION_ERROR_CODES.IMAGE_TOO_LARGE;
    result.errorMessage = `Image file is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum allowed size is ${AI_IMAGE_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB.`;
    aiIssues.push('File size exceeds AI processing limits');
    return result;
  }

  if (file.size < AI_IMAGE_CONSTRAINTS.MIN_FILE_SIZE) {
    result.errorCode = AI_VISION_ERROR_CODES.INVALID_IMAGE;
    result.errorMessage = 'Image file is too small or corrupted';
    aiIssues.push('File size is suspiciously small');
    return result;
  }

  // Check MIME type support
  if (!AI_IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.includes(file.type as any)) {
    result.errorCode = AI_VISION_ERROR_CODES.UNSUPPORTED_FORMAT;
    result.errorMessage = `Unsupported image format: ${file.type}. Supported formats: ${AI_IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`;
    aiIssues.push('Image format not optimized for AI processing');
    return result;
  }

  // Try to get image dimensions
  try {
    const dimensions = await getImageDimensions(file);
    result.dimensions = dimensions;

    // Validate dimensions
    if (
      dimensions.width < AI_IMAGE_CONSTRAINTS.MIN_WIDTH ||
      dimensions.height < AI_IMAGE_CONSTRAINTS.MIN_HEIGHT
    ) {
      result.errorCode = AI_VISION_ERROR_CODES.INVALID_IMAGE;
      result.errorMessage = `Image dimensions too small (${dimensions.width}x${dimensions.height}). Minimum required: ${AI_IMAGE_CONSTRAINTS.MIN_WIDTH}x${AI_IMAGE_CONSTRAINTS.MIN_HEIGHT}`;
      aiIssues.push('Image resolution too low for reliable text extraction');
      return result;
    }

    if (
      dimensions.width > AI_IMAGE_CONSTRAINTS.MAX_WIDTH ||
      dimensions.height > AI_IMAGE_CONSTRAINTS.MAX_HEIGHT
    ) {
      aiIssues.push('Image resolution very high, may cause memory issues');
      recommendations.push(
        'Consider resizing image to improve processing speed'
      );
    }

    // Check aspect ratio for Romanian ID cards (approximately 3:2)
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio < 1.2 || aspectRatio > 2.5) {
      aiIssues.push('Image aspect ratio unusual for ID document');
      recommendations.push('Ensure the image shows the complete ID card');
    }
  } catch (error) {
    result.errorCode = AI_VISION_ERROR_CODES.INVALID_IMAGE;
    result.errorMessage =
      'Unable to read image dimensions. File may be corrupted.';
    aiIssues.push('Failed to analyze image structure');
    return result;
  }

  // Add quality recommendations based on file size and dimensions
  if (result.dimensions) {
    const pixelCount = result.dimensions.width * result.dimensions.height;
    const bytesPerPixel = file.size / pixelCount;

    if (bytesPerPixel < 0.5) {
      recommendations.push(
        'Image appears heavily compressed, may affect text recognition quality'
      );
    }

    if (file.size < 100 * 1024 && pixelCount > 1000000) {
      // < 100KB but > 1MP
      recommendations.push(
        'Image quality may be too low for optimal text extraction'
      );
    }
  }

  // All validations passed
  result.isValid = true;
  result.details!.aiValidationIssues = aiIssues;
  result.details!.recommendations = recommendations;

  return result;
}

/**
 * Gets image dimensions from a file
 */
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Maps file validation error codes to AI vision error codes
 */
function mapFileValidationError(errorCode?: string): AIVisionErrorCode {
  switch (errorCode) {
    case 'FILE_TOO_LARGE':
      return AI_VISION_ERROR_CODES.IMAGE_TOO_LARGE;
    case 'INVALID_MIME_TYPE':
    case 'INVALID_EXTENSION':
    case 'INVALID_SIGNATURE':
      return AI_VISION_ERROR_CODES.UNSUPPORTED_FORMAT;
    case 'CORRUPTED_FILE':
    case 'NO_FILE':
      return AI_VISION_ERROR_CODES.INVALID_IMAGE;
    default:
      return AI_VISION_ERROR_CODES.INVALID_IMAGE;
  }
}

/**
 * Validates multiple images for batch processing
 */
export async function validateImagesForAI(files: File[]): Promise<{
  validImages: File[];
  invalidImages: Array<{
    file: File;
    validation: AIImageValidationResult;
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}> {
  const validImages: File[] = [];
  const invalidImages: Array<{
    file: File;
    validation: AIImageValidationResult;
  }> = [];

  // Process validations in parallel
  const validationPromises = files.map(async file => {
    const validation = await validateImageForAI(file);
    return { file, validation };
  });

  const results = await Promise.all(validationPromises);

  results.forEach(({ file, validation }) => {
    if (validation.isValid) {
      validImages.push(file);
    } else {
      invalidImages.push({ file, validation });
    }
  });

  return {
    validImages,
    invalidImages,
    summary: {
      total: files.length,
      valid: validImages.length,
      invalid: invalidImages.length,
    },
  };
}

/**
 * Checks if an image needs preprocessing for optimal AI processing
 */
export function shouldPreprocessImage(validation: AIImageValidationResult): {
  shouldPreprocess: boolean;
  recommendedOptions: ImageProcessingOptions;
  reasons: string[];
} {
  const reasons: string[] = [];
  const options: ImageProcessingOptions = {};
  let shouldPreprocess = false;

  if (!validation.isValid || !validation.dimensions) {
    return { shouldPreprocess: false, recommendedOptions: {}, reasons: [] };
  }

  const { width, height } = validation.dimensions;
  const { fileSize } = validation;

  // Check if image is too large
  if (width > 2048 || height > 2048) {
    shouldPreprocess = true;
    options.max_width = 2048;
    options.max_height = 2048;
    reasons.push('Resize to improve processing speed');
  }

  // Check if image quality is too low
  const pixelCount = width * height;
  const bytesPerPixel = fileSize / pixelCount;

  if (bytesPerPixel < 0.3) {
    shouldPreprocess = true;
    options.quality = 85;
    reasons.push('Improve image quality for better text recognition');
  }

  // Check if enhancement might help
  if (fileSize < 200 * 1024 && pixelCount > 500000) {
    // Small file size but high resolution
    shouldPreprocess = true;
    options.enhance = true;
    reasons.push('Enhance image to improve text clarity');
  }

  return {
    shouldPreprocess,
    recommendedOptions: options,
    reasons,
  };
}
