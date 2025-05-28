/**
 * Contrast enhancement filter for image preprocessing
 * Improves text visibility and OCR accuracy
 */

import type {
  CanvasProcessingContext,
  PreprocessingConfig,
} from '../types/preprocessing-types';
import { getImageStatistics } from '../utils/canvas-utils';

/**
 * Apply contrast enhancement to image
 */
export function applyContrastEnhancement(
  context: CanvasProcessingContext,
  config: PreprocessingConfig['contrast'] = {
    enabled: true,
    factor: 1.2,
    adaptive: false,
    clipLimit: 2.0,
  }
): void {
  if (!config.enabled) return;

  const { context: ctx, width, height } = context;
  const adaptive = config.adaptive || false;
  const factor = config.factor || 1.2;
  const clipLimit = config.clipLimit || 2.0;

  if (adaptive) {
    applyAdaptiveContrastEnhancement(context, clipLimit);
  } else {
    applyLinearContrastEnhancement(context, factor);
  }

  // Update context's imageData reference
  context.imageData = ctx.getImageData(0, 0, width, height);
}

/**
 * Apply linear contrast enhancement
 */
function applyLinearContrastEnhancement(
  context: CanvasProcessingContext,
  factor: number
): void {
  const { context: ctx, imageData } = context;
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast enhancement to RGB channels
    for (let c = 0; c < 3; c++) {
      const value = data[i + c] || 0;
      const enhanced = factor * (value - 128) + 128;
      data[i + c] = Math.max(0, Math.min(255, Math.round(enhanced)));
    }
    // Alpha channel remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply adaptive contrast enhancement (CLAHE - Contrast Limited Adaptive Histogram Equalization)
 */
function applyAdaptiveContrastEnhancement(
  context: CanvasProcessingContext,
  clipLimit: number
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const tileSize = 64; // Size of each tile for local processing

  // Convert to grayscale for processing
  const grayData = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * (data[i] || 0) +
        0.587 * (data[i + 1] || 0) +
        0.114 * (data[i + 2] || 0)
    );
    grayData[i / 4] = gray;
  }

  // Process each tile
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);

  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      const startX = tileX * tileSize;
      const startY = tileY * tileSize;
      const endX = Math.min(startX + tileSize, width);
      const endY = Math.min(startY + tileSize, height);

      // Calculate histogram for this tile
      const histogram = new Array(256).fill(0);
      let pixelCount = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const gray = grayData[y * width + x] || 0;
          histogram[gray]++;
          pixelCount++;
        }
      }

      // Apply contrast limiting
      const clipValue = Math.floor((clipLimit * pixelCount) / 256);
      let redistributed = 0;

      for (let i = 0; i < 256; i++) {
        if (histogram[i] > clipValue) {
          redistributed += histogram[i] - clipValue;
          histogram[i] = clipValue;
        }
      }

      // Redistribute clipped pixels
      const redistribution = Math.floor(redistributed / 256);
      for (let i = 0; i < 256; i++) {
        histogram[i] += redistribution;
      }

      // Calculate cumulative distribution
      const cdf = new Array(256);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }

      // Normalize CDF
      const cdfMin = cdf.find(val => val > 0) || 0;
      const cdfMax = cdf[255] || 1;

      // Apply enhancement to pixels in this tile
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const pixelIndex = (y * width + x) * 4;
          const gray = grayData[y * width + x] || 0;

          // Calculate enhanced value
          const enhanced = Math.round(
            (((cdf[gray] || 0) - cdfMin) * 255) / (cdfMax - cdfMin)
          );

          // Apply enhancement to RGB channels proportionally
          const originalGray = Math.round(
            0.299 * (data[pixelIndex] || 0) +
              0.587 * (data[pixelIndex + 1] || 0) +
              0.114 * (data[pixelIndex + 2] || 0)
          );

          if (originalGray > 0) {
            const ratio = enhanced / originalGray;
            data[pixelIndex] = Math.max(
              0,
              Math.min(255, Math.round((data[pixelIndex] || 0) * ratio))
            );
            data[pixelIndex + 1] = Math.max(
              0,
              Math.min(255, Math.round((data[pixelIndex + 1] || 0) * ratio))
            );
            data[pixelIndex + 2] = Math.max(
              0,
              Math.min(255, Math.round((data[pixelIndex + 2] || 0) * ratio))
            );
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Calculate optimal contrast factor for image
 */
export function calculateOptimalContrastFactor(imageData: ImageData): number {
  const stats = getImageStatistics(imageData);
  const contrast = stats.std.luminance / 127.5; // Normalize to 0-1

  // If contrast is already good, apply minimal enhancement
  if (contrast > 0.6) {
    return 1.1;
  }

  // If contrast is poor, apply stronger enhancement
  if (contrast < 0.3) {
    return 1.8;
  }

  // Medium contrast - moderate enhancement
  return 1.4;
}

/**
 * Check if image needs contrast enhancement
 */
export function needsContrastEnhancement(
  imageData: ImageData,
  threshold = 0.4
): boolean {
  const stats = getImageStatistics(imageData);
  const contrast = stats.std.luminance / 127.5;
  return contrast < threshold;
}

/**
 * Apply histogram stretching for contrast enhancement
 */
export function applyHistogramStretching(
  context: CanvasProcessingContext
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;

  // Find min and max values for each channel
  let minR = 255,
    maxR = 0;
  let minG = 255,
    maxG = 0;
  let minB = 255,
    maxB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minG = Math.min(minG, g);
    maxG = Math.max(maxG, g);
    minB = Math.min(minB, b);
    maxB = Math.max(maxB, b);
  }

  // Calculate stretch factors
  const rangeR = maxR - minR || 1;
  const rangeG = maxG - minG || 1;
  const rangeB = maxB - minB || 1;

  // Apply stretching
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round((((data[i] || 0) - minR) * 255) / rangeR);
    data[i + 1] = Math.round((((data[i + 1] || 0) - minG) * 255) / rangeG);
    data[i + 2] = Math.round((((data[i + 2] || 0) - minB) * 255) / rangeB);
  }

  ctx.putImageData(imageData, 0, 0);
  context.imageData = ctx.getImageData(0, 0, width, height);
}
