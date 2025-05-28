/**
 * Image Rotation Detection Utilities
 * Detects and corrects image rotation for optimal AI processing
 */

import type {
  RotationDetectionResult,
  ImageMetadata,
} from '@/lib/types/image-processing-types';

/**
 * Rotation detection thresholds
 */
export const ROTATION_THRESHOLDS = {
  CONFIDENCE_THRESHOLD: 0.6,
  EDGE_DENSITY_THRESHOLD: 0.3,
  TEXT_LINE_THRESHOLD: 0.4,
} as const;

/**
 * Detect image rotation using edge analysis
 */
export async function detectRotation(
  file: File
): Promise<RotationDetectionResult> {
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

        // Use smaller size for rotation detection (performance optimization)
        const analysisWidth = Math.min(img.width, 400);
        const analysisHeight = Math.min(img.height, 300);

        canvas.width = analysisWidth;
        canvas.height = analysisHeight;

        ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);

        // Detect rotation using multiple methods
        const edgeBasedRotation = detectRotationByEdges(canvas);
        const aspectRatioRotation = detectRotationByAspectRatio(
          img.width,
          img.height
        );

        // Combine results with weighted confidence
        const combinedResult = combineRotationResults([
          edgeBasedRotation,
          aspectRatioRotation,
        ]);

        resolve(combinedResult);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for rotation detection'));
    };

    img.src = url;
  });
}

/**
 * Detect rotation based on edge analysis
 */
function detectRotationByEdges(
  canvas: HTMLCanvasElement
): RotationDetectionResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      angle: 0,
      confidence: 0,
      shouldCorrect: false,
      orientation: 'landscape',
    };
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Calculate edge density for different orientations
  const horizontalEdges = calculateHorizontalEdgeDensity(data, width, height);
  const verticalEdges = calculateVerticalEdgeDensity(data, width, height);

  // Determine rotation based on edge analysis
  let angle = 0;
  let confidence = 0;

  // For Romanian ID cards, we expect more horizontal text lines
  const edgeRatio = horizontalEdges / (verticalEdges + 0.001); // Avoid division by zero

  if (edgeRatio > 1.5) {
    // Strong horizontal edges - likely correct orientation
    angle = 0;
    confidence = Math.min(edgeRatio / 3, 1);
  } else if (edgeRatio < 0.7) {
    // Strong vertical edges - likely rotated 90 degrees
    angle = 90;
    confidence = Math.min(1 / edgeRatio / 3, 1);
  } else {
    // Unclear - low confidence
    angle = 0;
    confidence = 0.3;
  }

  return {
    angle,
    confidence,
    shouldCorrect:
      confidence > ROTATION_THRESHOLDS.CONFIDENCE_THRESHOLD && angle !== 0,
    orientation: angle === 0 || angle === 180 ? 'landscape' : 'portrait',
  };
}

/**
 * Detect rotation based on aspect ratio
 */
function detectRotationByAspectRatio(
  width: number,
  height: number
): RotationDetectionResult {
  const aspectRatio = width / height;

  // Romanian ID cards have a landscape aspect ratio (~1.6:1)
  const idealAspectRatio = 1.6;
  const rotatedAspectRatio = height / width;

  const normalDiff = Math.abs(aspectRatio - idealAspectRatio);
  const rotatedDiff = Math.abs(rotatedAspectRatio - idealAspectRatio);

  let angle = 0;
  let confidence = 0;

  if (normalDiff < rotatedDiff) {
    // Current orientation is better
    angle = 0;
    confidence = Math.max(0, 1 - normalDiff);
  } else {
    // Rotated orientation would be better
    angle = 90;
    confidence = Math.max(0, 1 - rotatedDiff);
  }

  return {
    angle,
    confidence: confidence * 0.7, // Lower weight for aspect ratio method
    shouldCorrect: confidence > 0.5 && angle !== 0,
    orientation: angle === 0 || angle === 180 ? 'landscape' : 'portrait',
  };
}

/**
 * Calculate horizontal edge density
 */
function calculateHorizontalEdgeDensity(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let edgeCount = 0;
  let totalPixels = 0;

  // Sobel horizontal kernel
  const kernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let edgeValue = 0;

      // Apply Sobel horizontal kernel
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelIndex = (ky + 1) * 3 + (kx + 1);

          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          const kernelValue = kernel[kernelIndex];

          if (
            r !== undefined &&
            g !== undefined &&
            b !== undefined &&
            kernelValue !== undefined
          ) {
            const gray = (r + g + b) / 3;
            edgeValue += gray * kernelValue;
          }
        }
      }

      if (Math.abs(edgeValue) > 50) {
        // Edge threshold
        edgeCount++;
      }
      totalPixels++;
    }
  }

  return totalPixels > 0 ? edgeCount / totalPixels : 0;
}

/**
 * Calculate vertical edge density
 */
function calculateVerticalEdgeDensity(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let edgeCount = 0;
  let totalPixels = 0;

  // Sobel vertical kernel
  const kernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let edgeValue = 0;

      // Apply Sobel vertical kernel
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelIndex = (ky + 1) * 3 + (kx + 1);

          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          const kernelValue = kernel[kernelIndex];

          if (
            r !== undefined &&
            g !== undefined &&
            b !== undefined &&
            kernelValue !== undefined
          ) {
            const gray = (r + g + b) / 3;
            edgeValue += gray * kernelValue;
          }
        }
      }

      if (Math.abs(edgeValue) > 50) {
        // Edge threshold
        edgeCount++;
      }
      totalPixels++;
    }
  }

  return totalPixels > 0 ? edgeCount / totalPixels : 0;
}

/**
 * Combine multiple rotation detection results
 */
function combineRotationResults(
  results: RotationDetectionResult[]
): RotationDetectionResult {
  if (results.length === 0) {
    return {
      angle: 0,
      confidence: 0,
      shouldCorrect: false,
      orientation: 'landscape',
    };
  }

  // Weight results by confidence and combine
  let totalWeight = 0;
  let weightedAngle = 0;
  let maxConfidence = 0;

  for (const result of results) {
    const weight = result.confidence;
    totalWeight += weight;
    weightedAngle += result.angle * weight;
    maxConfidence = Math.max(maxConfidence, result.confidence);
  }

  const finalAngle =
    totalWeight > 0 ? Math.round(weightedAngle / totalWeight) : 0;

  // Normalize angle to common rotations (0, 90, 180, 270)
  const normalizedAngle = Math.round(finalAngle / 90) * 90;

  return {
    angle: normalizedAngle,
    confidence: maxConfidence,
    shouldCorrect:
      maxConfidence > ROTATION_THRESHOLDS.CONFIDENCE_THRESHOLD &&
      normalizedAngle !== 0,
    orientation:
      normalizedAngle === 0 || normalizedAngle === 180
        ? 'landscape'
        : 'portrait',
  };
}

/**
 * Apply rotation correction to image
 */
export async function correctImageRotation(
  file: File,
  rotationAngle: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Calculate new dimensions after rotation
        const radians = (rotationAngle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Apply rotation
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for rotation correction'));
    };

    img.src = url;
  });
}

/**
 * Quick rotation check for common cases
 */
export function quickRotationCheck(
  metadata: ImageMetadata
): RotationDetectionResult {
  const { aspectRatio } = metadata;

  // Romanian ID cards should be landscape (wider than tall)
  if (aspectRatio < 1.0) {
    return {
      angle: 90,
      confidence: 0.8,
      shouldCorrect: true,
      orientation: 'portrait',
    };
  }

  return {
    angle: 0,
    confidence: 0.7,
    shouldCorrect: false,
    orientation: 'landscape',
  };
}
