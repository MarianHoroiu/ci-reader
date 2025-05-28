/**
 * Image handling utilities for AI vision processing
 * Handles image preprocessing, base64 conversion, and memory management
 */

import { type ImageProcessingOptions } from '@/lib/types/romanian-id-types';

export interface ImageProcessingResult {
  /** Base64 encoded image data */
  base64: string;
  /** Original file size in bytes */
  originalSize: number;
  /** Processed image size in bytes */
  processedSize: number;
  /** Image dimensions after processing */
  dimensions: {
    width: number;
    height: number;
  };
  /** Processing metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;
    /** Operations performed */
    operations: string[];
    /** Quality assessment */
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

/**
 * Converts a file to base64 string for AI processing
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Invalid data URL format'));
        return;
      }
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file as base64'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Processes an image file for optimal AI vision processing
 */
export async function processImageForAI(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ImageProcessingResult> {
  const startTime = Date.now();
  const operations: string[] = [];

  // Get original image dimensions
  const originalDimensions = await getImageDimensions(file);

  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context for image processing');
  }

  // Load image
  const img = await loadImage(file);

  // Calculate target dimensions
  let targetWidth = img.width;
  let targetHeight = img.height;

  // Apply resizing if needed
  if (options.max_width || options.max_height) {
    const maxWidth = options.max_width || Infinity;
    const maxHeight = options.max_height || Infinity;

    const scaleX = maxWidth / img.width;
    const scaleY = maxHeight / img.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    if (scale < 1) {
      targetWidth = Math.round(img.width * scale);
      targetHeight = Math.round(img.height * scale);
      operations.push(
        `Resized from ${img.width}x${img.height} to ${targetWidth}x${targetHeight}`
      );
    }
  }

  // Set canvas dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Apply image enhancement if requested
  if (options.enhance) {
    // Apply image sharpening and contrast enhancement
    ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
    operations.push('Enhanced contrast and brightness');
  }

  // Convert to grayscale if requested
  if (options.grayscale) {
    ctx.filter = (ctx.filter || '') + ' grayscale(100%)';
    operations.push('Converted to grayscale');
  }

  // Draw the image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Get quality setting
  const quality = options.quality ? options.quality / 100 : 0.9;

  // Convert to base64
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.split(',')[1];

  if (!base64) {
    throw new Error('Failed to generate base64 data from canvas');
  }

  // Calculate processed size (approximate)
  const processedSize = Math.round(base64.length * 0.75); // Base64 is ~33% larger than binary

  // Assess image quality
  const imageQuality = assessImageQuality(
    file.size,
    processedSize,
    originalDimensions
  );

  // Clean up
  canvas.remove();

  const processingTime = Date.now() - startTime;

  return {
    base64,
    originalSize: file.size,
    processedSize,
    dimensions: {
      width: targetWidth,
      height: targetHeight,
    },
    metadata: {
      processingTime,
      operations,
      quality: imageQuality,
    },
  };
}

/**
 * Loads an image file into an Image element
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Gets image dimensions from a file
 */
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return {
    width: img.width,
    height: img.height,
  };
}

/**
 * Assesses image quality based on file size and dimensions
 */
function assessImageQuality(
  originalSize: number,
  processedSize: number,
  dimensions: { width: number; height: number }
): 'excellent' | 'good' | 'fair' | 'poor' {
  const pixelCount = dimensions.width * dimensions.height;
  const bytesPerPixel = originalSize / pixelCount;

  // High resolution and good compression
  if (pixelCount > 2000000 && bytesPerPixel > 1.5) {
    return 'excellent';
  }

  // Good resolution and decent compression
  if (pixelCount > 1000000 && bytesPerPixel > 0.8) {
    return 'good';
  }

  // Adequate resolution
  if (pixelCount > 500000 && bytesPerPixel > 0.4) {
    return 'fair';
  }

  // Low quality
  return 'poor';
}

/**
 * Optimizes image for Romanian ID processing specifically
 */
export async function optimizeForRomanianID(
  file: File
): Promise<ImageProcessingResult> {
  // Romanian ID cards are typically landscape orientation
  // Optimize for text recognition
  const options: ImageProcessingOptions = {
    max_width: 2048,
    max_height: 1536,
    quality: 90,
    enhance: true,
    // Don't convert to grayscale as color can help with field detection
  };

  return processImageForAI(file, options);
}

/**
 * Creates a thumbnail version of the image for preview
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 300
): Promise<string> {
  const options: ImageProcessingOptions = {
    max_width: maxSize,
    max_height: maxSize,
    quality: 80,
  };

  const result = await processImageForAI(file, options);
  return `data:image/jpeg;base64,${result.base64}`;
}

/**
 * Estimates processing time based on image characteristics
 */
export function estimateProcessingTime(
  file: File,
  dimensions?: { width: number; height: number }
): number {
  const baseTime = 2000; // 2 seconds base processing time

  // Add time based on file size (larger files take longer)
  const sizeMultiplier = Math.min(file.size / (1024 * 1024), 10); // Cap at 10MB
  const sizeTime = sizeMultiplier * 500; // 500ms per MB

  // Add time based on resolution if available
  let resolutionTime = 0;
  if (dimensions) {
    const megapixels = (dimensions.width * dimensions.height) / 1000000;
    resolutionTime = megapixels * 1000; // 1 second per megapixel
  }

  return Math.round(baseTime + sizeTime + resolutionTime);
}

/**
 * Validates that base64 string is valid image data
 */
export function validateBase64Image(base64: string): boolean {
  try {
    // Check if it's valid base64
    const decoded = atob(base64);

    // Check if it has reasonable length (not empty, not too large)
    if (decoded.length < 100 || decoded.length > 50 * 1024 * 1024) {
      return false;
    }

    // Basic check for image file signatures
    const uint8Array = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      uint8Array[i] = decoded.charCodeAt(i);
    }

    // Check for JPEG signature (FF D8 FF)
    if (
      uint8Array[0] === 0xff &&
      uint8Array[1] === 0xd8 &&
      uint8Array[2] === 0xff
    ) {
      return true;
    }

    // Check for PNG signature (89 50 4E 47)
    if (
      uint8Array[0] === 0x89 &&
      uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x4e &&
      uint8Array[3] === 0x47
    ) {
      return true;
    }

    // Check for WebP signature (52 49 46 46)
    if (
      uint8Array[0] === 0x52 &&
      uint8Array[1] === 0x49 &&
      uint8Array[2] === 0x46 &&
      uint8Array[3] === 0x46
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
