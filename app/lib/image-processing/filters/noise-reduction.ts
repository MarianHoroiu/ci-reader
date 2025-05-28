/**
 * Noise reduction filter for image preprocessing
 * Removes noise while preserving text clarity
 */

import type {
  CanvasProcessingContext,
  PreprocessingConfig,
} from '../types/preprocessing-types';
import { applyConvolution, createKernel } from '../utils/canvas-utils';

/**
 * Apply noise reduction to image
 */
export function applyNoiseReduction(
  context: CanvasProcessingContext,
  config: PreprocessingConfig['noiseReduction'] = {
    enabled: true,
    method: 'median',
    kernelSize: 3,
    strength: 0.5,
  }
): void {
  if (!config.enabled) return;

  const method = config.method || 'median';
  const kernelSize = config.kernelSize || 3;
  const strength = config.strength || 0.5;

  switch (method) {
    case 'median':
      applyMedianFilter(context, kernelSize);
      break;
    case 'gaussian':
      applyGaussianFilter(context, kernelSize, strength);
      break;
    case 'bilateral':
      applyBilateralFilter(context, kernelSize, strength);
      break;
    default:
      applyMedianFilter(context, kernelSize);
  }

  // Update context's imageData reference
  const { context: ctx, width, height } = context;
  context.imageData = ctx.getImageData(0, 0, width, height);
}

/**
 * Apply median filter for noise reduction
 */
function applyMedianFilter(
  context: CanvasProcessingContext,
  kernelSize: number
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);

  // Copy original data first
  newData.set(data);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      const pixelIndex = (y * width + x) * 4;

      // Process each color channel
      for (let c = 0; c < 3; c++) {
        const values: number[] = [];

        // Collect values from neighborhood
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const neighborIndex = ((y + dy) * width + (x + dx)) * 4 + c;
            values.push(data[neighborIndex] || 0);
          }
        }

        // Sort and find median
        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)] || 0;
        newData[pixelIndex + c] = median;
      }

      // Preserve alpha channel
      newData[pixelIndex + 3] = data[pixelIndex + 3] || 255;
    }
  }

  const processedImageData = new ImageData(newData, width, height);
  ctx.putImageData(processedImageData, 0, 0);
}

/**
 * Apply Gaussian filter for noise reduction
 */
function applyGaussianFilter(
  context: CanvasProcessingContext,
  kernelSize: number,
  strength: number
): void {
  const { context: ctx, imageData } = context;

  // Create Gaussian kernel
  const kernel = createKernel('gaussian', kernelSize);

  // Apply convolution
  const processedImageData = applyConvolution(imageData, kernel, kernelSize);

  // Blend with original based on strength
  if (strength < 1.0) {
    const originalData = imageData.data;
    const processedData = processedImageData.data;

    for (let i = 0; i < originalData.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const original = originalData[i + c] || 0;
        const processed = processedData[i + c] || 0;
        processedData[i + c] = Math.round(
          original * (1 - strength) + processed * strength
        );
      }
    }
  }

  ctx.putImageData(processedImageData, 0, 0);
}

/**
 * Apply bilateral filter for edge-preserving noise reduction
 */
function applyBilateralFilter(
  context: CanvasProcessingContext,
  kernelSize: number,
  strength: number
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);

  // Bilateral filter parameters
  const sigmaSpace = kernelSize / 3; // Spatial sigma
  const sigmaColor = strength * 50; // Color sigma (0-50 range)

  // Copy original data first
  newData.set(data);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      const pixelIndex = (y * width + x) * 4;

      // Process each color channel
      for (let c = 0; c < 3; c++) {
        const centerValue = data[pixelIndex + c] || 0;
        let weightSum = 0;
        let valueSum = 0;

        // Process neighborhood
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const neighborIndex = ((y + dy) * width + (x + dx)) * 4 + c;
            const neighborValue = data[neighborIndex] || 0;

            // Calculate spatial weight
            const spatialDistance = Math.sqrt(dx * dx + dy * dy);
            const spatialWeight = Math.exp(
              -(spatialDistance * spatialDistance) /
                (2 * sigmaSpace * sigmaSpace)
            );

            // Calculate color weight
            const colorDistance = Math.abs(centerValue - neighborValue);
            const colorWeight = Math.exp(
              -(colorDistance * colorDistance) / (2 * sigmaColor * sigmaColor)
            );

            // Combined weight
            const weight = spatialWeight * colorWeight;
            weightSum += weight;
            valueSum += neighborValue * weight;
          }
        }

        // Set filtered value
        newData[pixelIndex + c] = Math.round(valueSum / weightSum);
      }

      // Preserve alpha channel
      newData[pixelIndex + 3] = data[pixelIndex + 3] || 255;
    }
  }

  const processedImageData = new ImageData(newData, width, height);
  ctx.putImageData(processedImageData, 0, 0);
}

/**
 * Apply morphological opening to remove small noise
 */
export function applyMorphologicalOpening(
  context: CanvasProcessingContext,
  kernelSize = 3
): void {
  // Apply erosion followed by dilation
  applyErosion(context, kernelSize);
  applyDilation(context, kernelSize);
}

/**
 * Apply morphological closing to fill small gaps
 */
export function applyMorphologicalClosing(
  context: CanvasProcessingContext,
  kernelSize = 3
): void {
  // Apply dilation followed by erosion
  applyDilation(context, kernelSize);
  applyErosion(context, kernelSize);
}

/**
 * Apply erosion morphological operation
 */
function applyErosion(
  context: CanvasProcessingContext,
  kernelSize: number
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      let minValue = 255;

      // Find minimum value in neighborhood
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const neighborIndex = (ny * width + nx) * 4;

          // Use grayscale value
          const gray = Math.round(
            0.299 * (data[neighborIndex] || 0) +
              0.587 * (data[neighborIndex + 1] || 0) +
              0.114 * (data[neighborIndex + 2] || 0)
          );
          minValue = Math.min(minValue, gray);
        }
      }

      // Set RGB channels to minimum value
      newData[pixelIndex] = minValue;
      newData[pixelIndex + 1] = minValue;
      newData[pixelIndex + 2] = minValue;
      newData[pixelIndex + 3] = data[pixelIndex + 3] || 255;
    }
  }

  const processedImageData = new ImageData(newData, width, height);
  ctx.putImageData(processedImageData, 0, 0);
  context.imageData = processedImageData;
}

/**
 * Apply dilation morphological operation
 */
function applyDilation(
  context: CanvasProcessingContext,
  kernelSize: number
): void {
  const { context: ctx, imageData, width, height } = context;
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      let maxValue = 0;

      // Find maximum value in neighborhood
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const neighborIndex = (ny * width + nx) * 4;

          // Use grayscale value
          const gray = Math.round(
            0.299 * (data[neighborIndex] || 0) +
              0.587 * (data[neighborIndex + 1] || 0) +
              0.114 * (data[neighborIndex + 2] || 0)
          );
          maxValue = Math.max(maxValue, gray);
        }
      }

      // Set RGB channels to maximum value
      newData[pixelIndex] = maxValue;
      newData[pixelIndex + 1] = maxValue;
      newData[pixelIndex + 2] = maxValue;
      newData[pixelIndex + 3] = data[pixelIndex + 3] || 255;
    }
  }

  const processedImageData = new ImageData(newData, width, height);
  ctx.putImageData(processedImageData, 0, 0);
  context.imageData = processedImageData;
}

/**
 * Detect optimal noise reduction method for image
 */
export function detectOptimalNoiseReductionMethod(
  imageData: ImageData
): 'median' | 'gaussian' | 'bilateral' {
  const { width, height, data } = imageData;
  let edgeCount = 0;
  let noiseLevel = 0;
  let sampleCount = 0;

  // Sample image to detect characteristics
  for (let y = 1; y < height - 1; y += 4) {
    for (let x = 1; x < width - 1; x += 4) {
      const idx = (y * width + x) * 4;
      const center =
        0.299 * (data[idx] || 0) +
        0.587 * (data[idx + 1] || 0) +
        0.114 * (data[idx + 2] || 0);

      // Calculate local variance (noise indicator)
      let localVariance = 0;
      let neighborCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const neighbor =
            0.299 * (data[nIdx] || 0) +
            0.587 * (data[nIdx + 1] || 0) +
            0.114 * (data[nIdx + 2] || 0);
          localVariance += Math.pow(neighbor - center, 2);
          neighborCount++;
        }
      }

      localVariance /= neighborCount;
      noiseLevel += localVariance;

      // Detect edges
      const gradient =
        Math.abs((data[idx + 4] || 0) - (data[idx - 4] || 0)) +
        Math.abs((data[idx + width * 4] || 0) - (data[idx - width * 4] || 0));
      if (gradient > 30) {
        edgeCount++;
      }

      sampleCount++;
    }
  }

  const avgNoise = noiseLevel / sampleCount;
  const edgeRatio = edgeCount / sampleCount;

  // Choose method based on image characteristics
  if (edgeRatio > 0.3) {
    // High edge content - use bilateral filter to preserve edges
    return 'bilateral';
  } else if (avgNoise > 100) {
    // High noise - use median filter
    return 'median';
  } else {
    // Low to medium noise - use Gaussian filter
    return 'gaussian';
  }
}
