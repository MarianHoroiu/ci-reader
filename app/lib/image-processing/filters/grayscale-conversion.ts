/**
 * Grayscale conversion filter for image preprocessing
 * Optimized for OCR text recognition
 */

import type {
  CanvasProcessingContext,
  PreprocessingConfig,
} from '../types/preprocessing-types';

/**
 * Convert image to grayscale using specified method
 */
export function applyGrayscaleConversion(
  context: CanvasProcessingContext,
  config: PreprocessingConfig['grayscale'] = {
    enabled: true,
    method: 'luminance',
    preserveAlpha: true,
  }
): void {
  if (!config.enabled) return;

  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const method = config.method || 'luminance';
  const preserveAlpha = config.preserveAlpha !== false;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    let gray: number;

    switch (method) {
      case 'luminance':
        // Standard luminance formula (ITU-R BT.709)
        gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        break;

      case 'average':
        // Simple average method
        gray = Math.round((r + g + b) / 3);
        break;

      case 'desaturation': {
        // Desaturation method (average of min and max)
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        gray = Math.round((max + min) / 2);
        break;
      }

      default:
        gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Apply grayscale value to RGB channels
    data[i] = gray; // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue

    // Preserve or set alpha channel
    if (!preserveAlpha) {
      data[i + 3] = 255; // Full opacity
    }
  }

  // Update canvas with processed image data
  ctx.putImageData(imageData, 0, 0);

  // Update context's imageData reference
  context.imageData = ctx.getImageData(0, 0, width, height);
}

/**
 * Check if image is already grayscale
 */
export function isGrayscale(imageData: ImageData): boolean {
  const { data } = imageData;

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    // 40 = 4 channels * 10 pixels
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    // If any RGB values differ significantly, it's not grayscale
    if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2 || Math.abs(r - b) > 2) {
      return false;
    }
  }

  return true;
}

/**
 * Get optimal grayscale method for given image
 */
export function getOptimalGrayscaleMethod(
  imageData: ImageData
): 'luminance' | 'average' | 'desaturation' {
  const { data } = imageData;
  let colorVariance = 0;
  let sampleCount = 0;

  // Sample pixels to determine color characteristics
  for (let i = 0; i < data.length; i += 40) {
    // Sample every 10th pixel
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    const mean = (r + g + b) / 3;
    const variance =
      Math.pow(r - mean, 2) + Math.pow(g - mean, 2) + Math.pow(b - mean, 2);
    colorVariance += variance;
    sampleCount++;
  }

  const avgVariance = colorVariance / sampleCount;

  // Choose method based on color characteristics
  if (avgVariance < 100) {
    // Low color variance - simple average works well
    return 'average';
  } else if (avgVariance > 1000) {
    // High color variance - desaturation preserves contrast better
    return 'desaturation';
  } else {
    // Medium variance - luminance method is optimal for text
    return 'luminance';
  }
}
