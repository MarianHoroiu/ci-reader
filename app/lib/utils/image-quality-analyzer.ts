/**
 * Image Quality Analysis Utilities
 * Analyzes image quality metrics for optimal AI processing
 */

import type {
  ImageQualityMetrics,
  ImageMetadata,
} from '@/lib/types/image-processing-types';

/**
 * Quality analysis thresholds
 */
export const QUALITY_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.7,
  FAIR: 0.5,
  POOR: 0.3,
} as const;

/**
 * Calculate image sharpness using Laplacian variance
 */
export function calculateSharpness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Convert to grayscale and apply Laplacian filter
  let variance = 0;
  let mean = 0;
  let count = 0;

  // Laplacian kernel
  const kernel = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let laplacian = 0;

      // Apply Laplacian kernel
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelRow = kernel[ky + 1];
          if (pixelIndex >= 0 && pixelIndex + 2 < data.length && kernelRow) {
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            if (r !== undefined && g !== undefined && b !== undefined) {
              const gray = (r + g + b) / 3;
              const kernelValue = kernelRow[kx + 1];
              if (kernelValue !== undefined) {
                laplacian += gray * kernelValue;
              }
            }
          }
        }
      }

      mean += laplacian;
      count++;
    }
  }

  if (count === 0) return 0;
  mean /= count;

  // Calculate variance
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let laplacian = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelRow = kernel[ky + 1];
          if (pixelIndex >= 0 && pixelIndex + 2 < data.length && kernelRow) {
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            if (r !== undefined && g !== undefined && b !== undefined) {
              const gray = (r + g + b) / 3;
              const kernelValue = kernelRow[kx + 1];
              if (kernelValue !== undefined) {
                laplacian += gray * kernelValue;
              }
            }
          }
        }
      }

      variance += Math.pow(laplacian - mean, 2);
    }
  }

  variance /= count;

  // Normalize to 0-1 range (empirically determined scaling)
  return Math.min(variance / 1000, 1);
}

/**
 * Calculate image contrast using RMS contrast
 */
export function calculateContrast(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  let sumSquared = 0;
  let count = 0;

  // Calculate mean luminance
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += luminance;
      count++;
    }
  }

  const mean = sum / count;

  // Calculate RMS contrast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sumSquared += Math.pow(luminance - mean, 2);
    }
  }

  const rmsContrast = Math.sqrt(sumSquared / count);

  // Normalize to 0-1 range
  return Math.min(rmsContrast / 128, 1);
}

/**
 * Calculate image brightness
 */
export function calculateBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += luminance;
      count++;
    }
  }

  const averageBrightness = sum / count;

  // Normalize to 0-1 range and apply optimal brightness curve
  const normalized = averageBrightness / 255;

  // Optimal brightness is around 0.5-0.7, penalize extremes
  if (normalized < 0.3 || normalized > 0.8) {
    return Math.max(0, 1 - Math.abs(normalized - 0.6) * 2);
  }

  return 1 - Math.abs(normalized - 0.6);
}

/**
 * Estimate noise level using local standard deviation
 */
export function calculateNoiseLevel(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 1;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  let totalVariance = 0;
  let sampleCount = 0;
  const windowSize = 5;

  // Sample variance in small windows
  for (let y = windowSize; y < height - windowSize; y += windowSize) {
    for (let x = windowSize; x < width - windowSize; x += windowSize) {
      let windowSum = 0;
      let windowSumSquared = 0;
      let windowCount = 0;

      // Calculate variance in this window
      for (let wy = -windowSize; wy <= windowSize; wy++) {
        for (let wx = -windowSize; wx <= windowSize; wx++) {
          const pixelIndex = ((y + wy) * width + (x + wx)) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];

          if (r !== undefined && g !== undefined && b !== undefined) {
            const gray = (r + g + b) / 3;
            windowSum += gray;
            windowSumSquared += gray * gray;
            windowCount++;
          }
        }
      }

      if (windowCount > 0) {
        const windowMean = windowSum / windowCount;
        const windowVariance =
          windowSumSquared / windowCount - windowMean * windowMean;

        totalVariance += windowVariance;
        sampleCount++;
      }
    }
  }

  if (sampleCount === 0) return 1;
  const averageVariance = totalVariance / sampleCount;

  // Convert variance to noise level (0 = no noise, 1 = high noise)
  // Empirically determined scaling
  return Math.min(averageVariance / 500, 1);
}

/**
 * Assess resolution adequacy for text recognition
 */
export function calculateResolutionScore(metadata: ImageMetadata): number {
  const { width, height } = metadata;
  const pixelCount = width * height;

  // Optimal resolution ranges for document OCR
  const minOptimal = 1024 * 768; // 0.8MP
  const maxOptimal = 2048 * 1536; // 3.1MP
  const minAcceptable = 640 * 480; // 0.3MP

  if (pixelCount < minAcceptable) {
    return 0; // Too low for reliable OCR
  }

  if (pixelCount >= minOptimal && pixelCount <= maxOptimal) {
    return 1; // Optimal range
  }

  if (pixelCount < minOptimal) {
    // Below optimal but acceptable
    return ((pixelCount - minAcceptable) / (minOptimal - minAcceptable)) * 0.8;
  }

  // Above optimal - diminishing returns and potential performance issues
  const excessFactor = (pixelCount - maxOptimal) / maxOptimal;
  return Math.max(0.6, 1 - excessFactor * 0.3);
}

/**
 * Calculate color balance score
 */
export function calculateColorBalance(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let count = 0;

  // Calculate average color values
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      redSum += r;
      greenSum += g;
      blueSum += b;
      count++;
    }
  }

  if (count === 0) return 0;

  const redAvg = redSum / count;
  const greenAvg = greenSum / count;
  const blueAvg = blueSum / count;

  // Calculate color balance deviation
  const overallAvg = (redAvg + greenAvg + blueAvg) / 3;
  const redDev = Math.abs(redAvg - overallAvg) / 255;
  const greenDev = Math.abs(greenAvg - overallAvg) / 255;
  const blueDev = Math.abs(blueAvg - overallAvg) / 255;

  const totalDeviation = (redDev + greenDev + blueDev) / 3;

  // Good color balance has low deviation
  return Math.max(0, 1 - totalDeviation * 2);
}

/**
 * Comprehensive image quality analysis
 */
export async function analyzeImageQuality(
  file: File,
  metadata: ImageMetadata
): Promise<ImageQualityMetrics> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        // Create canvas for analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Use reasonable size for analysis (balance between accuracy and performance)
        const analysisWidth = Math.min(img.width, 800);
        const analysisHeight = Math.min(img.height, 600);

        canvas.width = analysisWidth;
        canvas.height = analysisHeight;

        ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);

        // Calculate quality metrics
        const sharpness = calculateSharpness(canvas);
        const contrast = calculateContrast(canvas);
        const brightness = calculateBrightness(canvas);
        const noiseLevel = calculateNoiseLevel(canvas);
        const resolution = calculateResolutionScore(metadata);
        const colorBalance = calculateColorBalance(canvas);

        // Calculate overall score (weighted average)
        const weights = {
          sharpness: 0.25,
          contrast: 0.2,
          brightness: 0.15,
          noise: 0.15, // Lower noise is better
          resolution: 0.15,
          colorBalance: 0.1,
        };

        const overallScore =
          sharpness * weights.sharpness +
          contrast * weights.contrast +
          brightness * weights.brightness +
          (1 - noiseLevel) * weights.noise + // Invert noise level
          resolution * weights.resolution +
          colorBalance * weights.colorBalance;

        resolve({
          overallScore: Math.max(0, Math.min(1, overallScore)),
          sharpness,
          contrast,
          brightness,
          noiseLevel,
          resolution,
          colorBalance,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for quality analysis'));
    };

    img.src = url;
  });
}

/**
 * Get quality assessment text
 */
export function getQualityAssessment(metrics: ImageQualityMetrics): string {
  const { overallScore } = metrics;

  if (overallScore >= QUALITY_THRESHOLDS.EXCELLENT) {
    return 'Excellent';
  } else if (overallScore >= QUALITY_THRESHOLDS.GOOD) {
    return 'Good';
  } else if (overallScore >= QUALITY_THRESHOLDS.FAIR) {
    return 'Fair';
  } else {
    return 'Poor';
  }
}

/**
 * Get quality improvement recommendations
 */
export function getQualityRecommendations(
  metrics: ImageQualityMetrics
): string[] {
  const recommendations: string[] = [];

  if (metrics.sharpness < 0.5) {
    recommendations.push(
      'Image appears blurry. Try taking a sharper photo or using image sharpening.'
    );
  }

  if (metrics.contrast < 0.4) {
    recommendations.push(
      'Low contrast detected. Improve lighting or adjust contrast settings.'
    );
  }

  if (metrics.brightness < 0.4) {
    recommendations.push('Image is too dark. Increase lighting or brightness.');
  } else if (metrics.brightness > 0.8) {
    recommendations.push('Image is too bright. Reduce lighting or exposure.');
  }

  if (metrics.noiseLevel > 0.6) {
    recommendations.push(
      'High noise level detected. Use better lighting or noise reduction.'
    );
  }

  if (metrics.resolution < 0.5) {
    recommendations.push(
      'Resolution is too low for optimal text recognition. Use a higher resolution camera.'
    );
  }

  if (metrics.colorBalance < 0.5) {
    recommendations.push(
      'Color balance issues detected. Check white balance settings.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Image quality is good for processing.');
  }

  return recommendations;
}
