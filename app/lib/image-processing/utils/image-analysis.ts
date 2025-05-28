/**
 * Image quality analysis tools for preprocessing pipeline
 * Provides functions to analyze image quality and suitability for OCR
 */

import type {
  ImageQualityMetrics,
  ImageAnalysisResult,
  ImageFormat,
  PreprocessingOperation,
  CanvasProcessingContext,
} from '../types/preprocessing-types';
import { calculateHistogram, getImageStatistics } from './canvas-utils';

/**
 * Analyze image quality and suitability for OCR processing
 */
export function analyzeImage(
  context: CanvasProcessingContext
): ImageAnalysisResult {
  const { imageData, width, height } = context;

  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(imageData);

  // Detect image format (simplified - would need more sophisticated detection)
  const format: ImageFormat = 'png'; // Default assumption

  // Estimate file size (rough calculation)
  const size = width * height * 4; // RGBA bytes

  // Detect if this looks like a document image
  const isDocumentImage = detectDocumentImage(imageData, qualityMetrics);

  // Detect rotation
  const detectedRotation = detectRotation(imageData);

  // Recommend preprocessing operations
  const recommendedOperations = recommendPreprocessingOperations(
    qualityMetrics,
    isDocumentImage
  );

  // Calculate overall suitability score
  const suitabilityScore = calculateSuitabilityScore(
    qualityMetrics,
    isDocumentImage
  );

  return {
    dimensions: { width, height },
    format,
    size,
    qualityMetrics,
    isDocumentImage,
    detectedRotation,
    recommendedOperations,
    suitabilityScore,
  };
}

/**
 * Calculate comprehensive image quality metrics
 */
export function calculateQualityMetrics(
  imageData: ImageData
): ImageQualityMetrics {
  const sharpness = calculateSharpness(imageData);
  const contrast = calculateContrast(imageData);
  const brightness = calculateBrightness(imageData);
  const noise = calculateNoise(imageData);
  const textReadability = calculateTextReadability(imageData);

  // Calculate overall quality score (weighted average)
  const overall =
    sharpness * 0.25 +
    contrast * 0.2 +
    brightness * 0.15 +
    (1 - noise) * 0.2 + // Invert noise (lower noise = higher quality)
    textReadability * 0.2;

  return {
    sharpness,
    contrast,
    brightness,
    noise,
    overall,
    textReadability,
  };
}

/**
 * Calculate image sharpness using Laplacian variance
 */
export function calculateSharpness(imageData: ImageData): number {
  const { width, height, data } = imageData;

  // Laplacian kernel for edge detection
  const laplacian = [0, -1, 0, -1, 4, -1, 0, -1, 0];
  let variance = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const py = y + ky - 1;
          const px = x + kx - 1;
          const idx = (py * width + px) * 4;

          // Convert to grayscale
          const gray =
            0.299 * (data[idx] || 0) +
            0.587 * (data[idx + 1] || 0) +
            0.114 * (data[idx + 2] || 0);
          sum += gray * (laplacian[ky * 3 + kx] || 0);
        }
      }

      variance += sum * sum;
      count++;
    }
  }

  const normalizedVariance = variance / count;

  // Normalize to 0-1 range (empirically determined threshold)
  return Math.min(1, normalizedVariance / 10000);
}

/**
 * Calculate image contrast using standard deviation
 */
export function calculateContrast(imageData: ImageData): number {
  const stats = getImageStatistics(imageData);

  // Normalize standard deviation to 0-1 range
  // Maximum possible std for 8-bit values is ~127.5
  return Math.min(1, stats.std.luminance / 127.5);
}

/**
 * Calculate image brightness
 */
export function calculateBrightness(imageData: ImageData): number {
  const stats = getImageStatistics(imageData);

  // Normalize mean luminance to 0-1 range
  return stats.mean.luminance / 255;
}

/**
 * Calculate noise level using local variance
 */
export function calculateNoise(imageData: ImageData): number {
  const { width, height, data } = imageData;
  let totalVariance = 0;
  let count = 0;

  // Sample every 4th pixel for performance
  for (let y = 2; y < height - 2; y += 4) {
    for (let x = 2; x < width - 2; x += 4) {
      const centerIdx = (y * width + x) * 4;
      const centerGray =
        0.299 * (data[centerIdx] || 0) +
        0.587 * (data[centerIdx + 1] || 0) +
        0.114 * (data[centerIdx + 2] || 0);

      let localSum = 0;
      let localCount = 0;

      // Calculate local mean in 5x5 neighborhood
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          if (idx >= 0 && idx < data.length - 3) {
            const gray =
              0.299 * (data[idx] || 0) +
              0.587 * (data[idx + 1] || 0) +
              0.114 * (data[idx + 2] || 0);
            localSum += gray;
            localCount++;
          }
        }
      }

      const localMean = localSum / localCount;
      totalVariance += Math.pow(centerGray - localMean, 2);
      count++;
    }
  }

  const avgVariance = totalVariance / count;

  // Normalize to 0-1 range (empirically determined threshold)
  return Math.min(1, avgVariance / 1000);
}

/**
 * Calculate text readability score
 */
export function calculateTextReadability(imageData: ImageData): number {
  const histogram = calculateHistogram(imageData);

  // Calculate bimodality (good for text images which have distinct foreground/background)
  const bimodality = calculateBimodality(histogram.luminance);

  // Calculate edge density (text has many edges)
  const edgeDensity = calculateEdgeDensity(imageData);

  // Combine metrics
  return bimodality * 0.6 + edgeDensity * 0.4;
}

/**
 * Calculate bimodality of histogram (good for text detection)
 */
function calculateBimodality(histogram: number[]): number {
  const total = histogram.reduce((sum, count) => sum + count, 0);

  // Find peaks in histogram
  const peaks: number[] = [];
  for (let i = 1; i < histogram.length - 1; i++) {
    const current = histogram[i] || 0;
    const prev = histogram[i - 1] || 0;
    const next = histogram[i + 1] || 0;
    if (current > prev && current > next && current > total * 0.01) {
      peaks.push(i);
    }
  }

  // Good text images typically have 2 main peaks (foreground and background)
  if (peaks.length === 2) {
    const peak1 = peaks[0];
    const peak2 = peaks[1];
    if (peak1 !== undefined && peak2 !== undefined) {
      const separation = Math.abs(peak1 - peak2) / 255;
      return separation; // Higher separation = better bimodality
    }
  }

  return 0.5; // Neutral score if not clearly bimodal
}

/**
 * Calculate edge density using Sobel operator
 */
function calculateEdgeDensity(imageData: ImageData): number {
  const { width, height, data } = imageData;

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  let edgeCount = 0;
  let totalPixels = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0,
        gy = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const py = y + ky - 1;
          const px = x + kx - 1;
          const idx = (py * width + px) * 4;

          // Convert to grayscale
          const gray =
            0.299 * (data[idx] || 0) +
            0.587 * (data[idx + 1] || 0) +
            0.114 * (data[idx + 2] || 0);

          gx += gray * (sobelX[ky * 3 + kx] || 0);
          gy += gray * (sobelY[ky * 3 + kx] || 0);
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > 30) {
        // Threshold for edge detection
        edgeCount++;
      }
      totalPixels++;
    }
  }

  return edgeCount / totalPixels;
}

/**
 * Detect if image appears to be a document
 */
export function detectDocumentImage(
  imageData: ImageData,
  qualityMetrics: ImageQualityMetrics
): boolean {
  // Document images typically have:
  // - High text readability
  // - Moderate to high contrast
  // - Rectangular aspect ratio
  // - Bimodal histogram (text + background)

  const { width, height } = imageData;
  const aspectRatio = width / height;

  // Check for document-like aspect ratio (between 0.5 and 2.0)
  const hasDocumentAspectRatio = aspectRatio >= 0.5 && aspectRatio <= 2.0;

  // Check quality metrics
  const hasGoodTextReadability = qualityMetrics.textReadability > 0.6;
  const hasGoodContrast = qualityMetrics.contrast > 0.4;

  return hasDocumentAspectRatio && hasGoodTextReadability && hasGoodContrast;
}

/**
 * Detect rotation angle using projection method
 */
export function detectRotation(imageData: ImageData): number {
  const { width, height, data } = imageData;

  // Convert to grayscale and apply edge detection
  const edges = new Array(width * height).fill(0);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Simple edge detection using gradient
      const current =
        0.299 * (data[idx] || 0) +
        0.587 * (data[idx + 1] || 0) +
        0.114 * (data[idx + 2] || 0);
      const right =
        0.299 * (data[idx + 4] || 0) +
        0.587 * (data[idx + 5] || 0) +
        0.114 * (data[idx + 6] || 0);
      const bottom =
        0.299 * (data[idx + width * 4] || 0) +
        0.587 * (data[idx + width * 4 + 1] || 0) +
        0.114 * (data[idx + width * 4 + 2] || 0);

      const gradientX = Math.abs(right - current);
      const gradientY = Math.abs(bottom - current);
      const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

      edges[y * width + x] = gradient > 30 ? 1 : 0;
    }
  }

  // Test different angles and find the one with maximum horizontal/vertical alignment
  let bestAngle = 0;
  let maxScore = 0;

  for (let angle = -15; angle <= 15; angle += 0.5) {
    const score = calculateAlignmentScore(edges, width, height, angle);
    if (score > maxScore) {
      maxScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Calculate alignment score for a given rotation angle
 */
function calculateAlignmentScore(
  edges: number[],
  width: number,
  height: number,
  angle: number
): number {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  let horizontalScore = 0;
  let verticalScore = 0;

  // Sample horizontal lines
  for (let y = Math.floor(height * 0.2); y < height * 0.8; y += 10) {
    let lineSum = 0;
    for (let x = 0; x < width; x++) {
      const rotatedY = Math.round(y * cos - x * sin + height / 2);
      const rotatedX = Math.round(y * sin + x * cos + width / 2);

      if (
        rotatedY >= 0 &&
        rotatedY < height &&
        rotatedX >= 0 &&
        rotatedX < width
      ) {
        lineSum += edges[rotatedY * width + rotatedX] || 0;
      }
    }
    horizontalScore += lineSum;
  }

  // Sample vertical lines
  for (let x = Math.floor(width * 0.2); x < width * 0.8; x += 10) {
    let lineSum = 0;
    for (let y = 0; y < height; y++) {
      const rotatedY = Math.round(y * cos - x * sin + height / 2);
      const rotatedX = Math.round(y * sin + x * cos + width / 2);

      if (
        rotatedY >= 0 &&
        rotatedY < height &&
        rotatedX >= 0 &&
        rotatedX < width
      ) {
        lineSum += edges[rotatedY * width + rotatedX] || 0;
      }
    }
    verticalScore += lineSum;
  }

  return horizontalScore + verticalScore;
}

/**
 * Recommend preprocessing operations based on image analysis
 */
export function recommendPreprocessingOperations(
  qualityMetrics: ImageQualityMetrics,
  isDocumentImage: boolean
): PreprocessingOperation[] {
  const operations: PreprocessingOperation[] = [];

  // Always recommend grayscale for OCR
  operations.push('grayscale');

  // Recommend contrast enhancement if contrast is low
  if (qualityMetrics.contrast < 0.6) {
    operations.push('contrast_enhancement');
  }

  // Recommend brightness adjustment if too dark or too bright
  if (qualityMetrics.brightness < 0.3 || qualityMetrics.brightness > 0.8) {
    operations.push('brightness_adjustment');
  }

  // Recommend noise reduction if noise is high
  if (qualityMetrics.noise > 0.3) {
    operations.push('noise_reduction');
  }

  // Recommend sharpening if image is blurry
  if (qualityMetrics.sharpness < 0.5) {
    operations.push('sharpening');
  }

  // For document images, always recommend rotation correction
  if (isDocumentImage) {
    operations.push('rotation_correction');
  }

  // Recommend histogram equalization for low contrast documents
  if (isDocumentImage && qualityMetrics.contrast < 0.4) {
    operations.push('histogram_equalization');
  }

  return operations;
}

/**
 * Calculate overall suitability score for OCR processing
 */
export function calculateSuitabilityScore(
  qualityMetrics: ImageQualityMetrics,
  isDocumentImage: boolean
): number {
  let score = qualityMetrics.overall;

  // Bonus for document-like images
  if (isDocumentImage) {
    score += 0.1;
  }

  // Penalty for very poor quality
  if (qualityMetrics.overall < 0.3) {
    score *= 0.5;
  }

  // Bonus for high text readability
  if (qualityMetrics.textReadability > 0.7) {
    score += 0.1;
  }

  return Math.min(1, Math.max(0, score));
}
