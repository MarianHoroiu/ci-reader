/**
 * Rotation correction filter for image preprocessing
 * Detects and corrects document skew for better OCR accuracy
 */

import type {
  CanvasProcessingContext,
  PreprocessingConfig,
} from '../types/preprocessing-types';
import { detectRotation } from '../utils/image-analysis';

/**
 * Apply rotation correction to image
 */
export function applyRotationCorrection(
  context: CanvasProcessingContext,
  config: PreprocessingConfig['rotationCorrection'] = {
    enabled: true,
    maxAngle: 15,
    method: 'hough',
    precision: 0.5,
  }
): number {
  if (!config.enabled) return 0;

  const maxAngle = config.maxAngle || 15;
  const precision = config.precision || 0.5;
  const method = config.method || 'hough';

  // Detect rotation angle
  let angle: number;
  switch (method) {
    case 'projection':
      angle = detectRotationByProjection(context, maxAngle, precision);
      break;
    case 'edge_detection':
      angle = detectRotationByEdges(context, maxAngle, precision);
      break;
    case 'hough':
    default:
      angle = detectRotation(context.imageData);
      break;
  }

  // Clamp angle to maximum allowed
  angle = Math.max(-maxAngle, Math.min(maxAngle, angle));

  // Apply rotation if significant
  if (Math.abs(angle) > precision) {
    rotateImage(context, angle);
  }

  return angle;
}

/**
 * Rotate image by specified angle
 */
function rotateImage(context: CanvasProcessingContext, angle: number): void {
  const { canvas, context: ctx, width, height } = context;

  // Convert angle to radians
  const radians = (angle * Math.PI) / 180;

  // Calculate new dimensions to fit rotated image
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const newWidth = Math.ceil(width * cos + height * sin);
  const newHeight = Math.ceil(width * sin + height * cos);

  // Create temporary canvas for rotation
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('Failed to get 2D canvas context for rotation');
  }

  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;

  // Set white background
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, newWidth, newHeight);

  // Move to center and rotate
  tempCtx.translate(newWidth / 2, newHeight / 2);
  tempCtx.rotate(radians);

  // Draw original image centered
  tempCtx.drawImage(canvas, -width / 2, -height / 2);

  // Update original canvas with rotated image
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.clearRect(0, 0, newWidth, newHeight);
  ctx.drawImage(tempCanvas, 0, 0);

  // Update context dimensions and imageData
  context.width = newWidth;
  context.height = newHeight;
  context.imageData = ctx.getImageData(0, 0, newWidth, newHeight);
}

/**
 * Detect rotation using projection method
 */
function detectRotationByProjection(
  context: CanvasProcessingContext,
  maxAngle: number,
  precision: number
): number {
  const { imageData, width, height } = context;
  const data = imageData.data;

  // Convert to grayscale for analysis
  const grayData = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * (data[i] || 0) +
        0.587 * (data[i + 1] || 0) +
        0.114 * (data[i + 2] || 0)
    );
    grayData[i / 4] = gray;
  }

  let bestAngle = 0;
  let maxVariance = 0;

  // Test different angles
  for (let angle = -maxAngle; angle <= maxAngle; angle += precision) {
    const variance = calculateProjectionVariance(
      grayData,
      width,
      height,
      angle
    );
    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Calculate projection variance for given angle
 */
function calculateProjectionVariance(
  grayData: Uint8ClampedArray,
  width: number,
  height: number,
  angle: number
): number {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Calculate horizontal projection
  const projection: number[] = [];
  const projectionLength = Math.ceil(
    height * Math.abs(cos) + width * Math.abs(sin)
  );

  for (let i = 0; i < projectionLength; i++) {
    projection[i] = 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Rotate coordinates
      const rotatedY = Math.round(x * sin + y * cos);
      const projIndex = Math.round(rotatedY + projectionLength / 2);

      if (projIndex >= 0 && projIndex < projectionLength) {
        const gray = grayData[y * width + x] || 0;
        // Invert for text (dark text on light background)
        projection[projIndex] = (projection[projIndex] || 0) + (255 - gray);
      }
    }
  }

  // Calculate variance of projection
  const mean =
    projection.reduce((sum, val) => sum + val, 0) / projection.length;
  const variance =
    projection.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    projection.length;

  return variance;
}

/**
 * Detect rotation using edge detection method
 */
function detectRotationByEdges(
  context: CanvasProcessingContext,
  maxAngle: number,
  precision: number
): number {
  const { imageData, width, height } = context;
  const data = imageData.data;

  // Apply edge detection
  const edges = detectEdges(data, width, height);

  let bestAngle = 0;
  let maxScore = 0;

  // Test different angles
  for (let angle = -maxAngle; angle <= maxAngle; angle += precision) {
    const score = calculateEdgeAlignmentScore(edges, width, height, angle);
    if (score > maxScore) {
      maxScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Detect edges in image using Sobel operator
 */
function detectEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  const edges = new Array(width * height).fill(0);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

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
      edges[y * width + x] = magnitude > 30 ? 1 : 0;
    }
  }

  return edges;
}

/**
 * Calculate edge alignment score for given angle
 */
function calculateEdgeAlignmentScore(
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
  for (let y = Math.floor(height * 0.1); y < height * 0.9; y += 5) {
    let lineSum = 0;
    let count = 0;

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
        count++;
      }
    }

    if (count > 0) {
      horizontalScore += lineSum / count;
    }
  }

  // Sample vertical lines
  for (let x = Math.floor(width * 0.1); x < width * 0.9; x += 5) {
    let lineSum = 0;
    let count = 0;

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
        count++;
      }
    }

    if (count > 0) {
      verticalScore += lineSum / count;
    }
  }

  return horizontalScore + verticalScore;
}

/**
 * Detect rotation using Hough transform for line detection
 */
export function detectRotationByHoughTransform(
  context: CanvasProcessingContext,
  maxAngle = 15,
  precision = 0.5
): number {
  const { imageData, width, height } = context;
  const data = imageData.data;

  // Apply edge detection
  const edges = detectEdges(data, width, height);

  // Hough transform parameters
  const angleStep = (precision * Math.PI) / 180;
  const numAngles = Math.floor((2 * maxAngle) / precision) + 1;
  const maxRho = Math.sqrt(width * width + height * height);
  const rhoStep = 1;
  const numRhos = Math.floor((2 * maxRho) / rhoStep) + 1;

  // Accumulator array
  const accumulator = new Array(numAngles * numRhos).fill(0);

  // Populate accumulator
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x]) {
        for (let angleIdx = 0; angleIdx < numAngles; angleIdx++) {
          const angle = (angleIdx - numAngles / 2) * angleStep;
          const rho = x * Math.cos(angle) + y * Math.sin(angle);
          const rhoIdx = Math.round(rho / rhoStep + numRhos / 2);

          if (rhoIdx >= 0 && rhoIdx < numRhos) {
            accumulator[angleIdx * numRhos + rhoIdx]++;
          }
        }
      }
    }
  }

  // Find peak in accumulator
  let maxVotes = 0;
  let bestAngleIdx = Math.floor(numAngles / 2);

  for (let angleIdx = 0; angleIdx < numAngles; angleIdx++) {
    for (let rhoIdx = 0; rhoIdx < numRhos; rhoIdx++) {
      const votes = accumulator[angleIdx * numRhos + rhoIdx] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        bestAngleIdx = angleIdx;
      }
    }
  }

  // Convert back to degrees
  const bestAngle = (bestAngleIdx - numAngles / 2) * precision;
  return bestAngle;
}

/**
 * Check if image needs rotation correction
 */
export function needsRotationCorrection(
  imageData: ImageData,
  threshold = 1.0
): boolean {
  const detectedAngle = detectRotation(imageData);
  return Math.abs(detectedAngle) > threshold;
}

/**
 * Get optimal rotation correction method for image
 */
export function getOptimalRotationMethod(
  imageData: ImageData
): 'hough' | 'projection' | 'edge_detection' {
  const { width, height, data } = imageData;

  // Analyze image characteristics
  let edgeCount = 0;
  let textLikeRegions = 0;
  let sampleCount = 0;

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const gray =
        0.299 * (data[idx] || 0) +
        0.587 * (data[idx + 1] || 0) +
        0.114 * (data[idx + 2] || 0);

      // Check for edges
      if (x < width - 4 && y < height - 4) {
        const rightGray =
          0.299 * (data[idx + 16] || 0) +
          0.587 * (data[idx + 17] || 0) +
          0.114 * (data[idx + 18] || 0);
        const bottomGray =
          0.299 * (data[idx + width * 16] || 0) +
          0.587 * (data[idx + width * 16 + 1] || 0) +
          0.114 * (data[idx + width * 16 + 2] || 0);

        const gradient =
          Math.abs(rightGray - gray) + Math.abs(bottomGray - gray);
        if (gradient > 20) {
          edgeCount++;
        }
      }

      // Check for text-like regions (moderate contrast)
      if (gray > 50 && gray < 200) {
        textLikeRegions++;
      }

      sampleCount++;
    }
  }

  const edgeRatio = edgeCount / sampleCount;
  const textRatio = textLikeRegions / sampleCount;

  // Choose method based on image characteristics
  if (edgeRatio > 0.3) {
    // High edge content - Hough transform works well
    return 'hough';
  } else if (textRatio > 0.4) {
    // Text-heavy image - projection method is effective
    return 'projection';
  } else {
    // General case - edge detection method
    return 'edge_detection';
  }
}
