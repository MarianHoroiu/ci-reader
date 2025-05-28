/**
 * Canvas manipulation utilities for image processing
 * Provides helper functions for canvas operations and image handling
 */

import type {
  ImageInput,
  ImageFormat,
  CanvasProcessingContext,
  PreprocessingCompatibility,
} from '../types/preprocessing-types';

/**
 * Check browser compatibility for canvas and image processing features
 */
export function checkCanvasCompatibility(): PreprocessingCompatibility {
  const canvas2D =
    typeof HTMLCanvasElement !== 'undefined' &&
    HTMLCanvasElement.prototype.getContext !== undefined;

  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  const imageData = typeof ImageData !== 'undefined';

  const webWorkers = typeof Worker !== 'undefined';

  // Test supported formats
  const supportedFormats: ImageFormat[] = [];
  if (canvas2D) {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;

    // Test JPEG support
    try {
      testCanvas.toDataURL('image/jpeg');
      supportedFormats.push('jpeg');
    } catch {
      // JPEG not supported
    }

    // Test PNG support
    try {
      testCanvas.toDataURL('image/png');
      supportedFormats.push('png');
    } catch {
      // PNG not supported
    }

    // Test WebP support
    try {
      testCanvas.toDataURL('image/webp');
      supportedFormats.push('webp');
    } catch {
      // WebP not supported
    }
  }

  // Estimate max canvas size (conservative estimate)
  const maxCanvasSize = canvas2D ? 16384 : 0; // Most browsers support at least 16K

  const features: string[] = [];
  const limitations: string[] = [];

  if (canvas2D) features.push('Canvas 2D');
  else limitations.push('Canvas 2D not supported');

  if (offscreenCanvas) features.push('OffscreenCanvas');
  else limitations.push('OffscreenCanvas not available');

  if (imageData) features.push('ImageData');
  else limitations.push('ImageData not supported');

  if (webWorkers) features.push('Web Workers');
  else limitations.push('Web Workers not available');

  return {
    canvas2D,
    offscreenCanvas,
    imageData,
    webWorkers,
    supportedFormats,
    maxCanvasSize,
    features,
    limitations,
  };
}

/**
 * Create a canvas processing context from image input
 */
export async function createCanvasContext(
  imageInput: ImageInput,
  maxDimensions?: { width: number; height: number }
): Promise<CanvasProcessingContext> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get 2D canvas context');
  }

  let img: HTMLImageElement;

  // Handle different input types
  if (typeof imageInput === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image from URL'));
      img.src = imageInput;
    });
  } else if (imageInput instanceof File) {
    img = new Image();
    const url = URL.createObjectURL(imageInput);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image from file'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  } else if (imageInput instanceof HTMLImageElement) {
    img = imageInput;
  } else if (imageInput instanceof HTMLCanvasElement) {
    // Copy canvas content
    canvas.width = imageInput.width;
    canvas.height = imageInput.height;
    context.drawImage(imageInput, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return {
      canvas,
      context,
      imageData,
      width: canvas.width,
      height: canvas.height,
    };
  } else if (imageInput instanceof ImageData) {
    // Create canvas from ImageData
    canvas.width = imageInput.width;
    canvas.height = imageInput.height;
    context.putImageData(imageInput, 0, 0);
    return {
      canvas,
      context,
      imageData: imageInput,
      width: canvas.width,
      height: canvas.height,
    };
  } else {
    throw new Error('Unsupported image input type');
  }

  // Calculate dimensions with optional constraints
  let { width, height } = img;

  if (maxDimensions) {
    const scaleX = maxDimensions.width / width;
    const scaleY = maxDimensions.height / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
  }

  // Set canvas dimensions and draw image
  canvas.width = width;
  canvas.height = height;
  context.drawImage(img, 0, 0, width, height);

  // Get image data
  const imageData = context.getImageData(0, 0, width, height);

  return { canvas, context, imageData, width, height };
}

/**
 * Convert canvas to different output formats
 */
export function canvasToOutput(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png',
  quality = 0.9
): string {
  const mimeType = `image/${format}`;
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Convert ImageData to canvas
 */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get 2D canvas context');
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Clone ImageData
 */
export function cloneImageData(imageData: ImageData): ImageData {
  const clonedData = new Uint8ClampedArray(imageData.data);
  return new ImageData(clonedData, imageData.width, imageData.height);
}

/**
 * Resize canvas while maintaining aspect ratio
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
  preserveAspectRatio = true
): HTMLCanvasElement {
  const { width: sourceWidth, height: sourceHeight } = sourceCanvas;

  let targetWidth = maxWidth;
  let targetHeight = maxHeight;

  if (preserveAspectRatio) {
    const aspectRatio = sourceWidth / sourceHeight;

    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = targetHeight * aspectRatio;
    } else {
      targetHeight = targetWidth / aspectRatio;
    }
  }

  const targetCanvas = document.createElement('canvas');
  const targetContext = targetCanvas.getContext('2d');

  if (!targetContext) {
    throw new Error('Failed to get 2D canvas context');
  }

  targetCanvas.width = Math.round(targetWidth);
  targetCanvas.height = Math.round(targetHeight);

  // Use high-quality scaling
  targetContext.imageSmoothingEnabled = true;
  targetContext.imageSmoothingQuality = 'high';

  targetContext.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return targetCanvas;
}

/**
 * Create a kernel for convolution operations
 */
export function createKernel(
  type: 'gaussian' | 'sharpen' | 'edge' | 'emboss',
  size = 3
): number[] {
  switch (type) {
    case 'gaussian':
      if (size === 3) {
        return [1, 2, 1, 2, 4, 2, 1, 2, 1].map(x => x / 16);
      } else if (size === 5) {
        return [
          1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4,
          1, 4, 6, 4, 1,
        ].map(x => x / 256);
      }
      break;

    case 'sharpen':
      return [0, -1, 0, -1, 5, -1, 0, -1, 0];

    case 'edge':
      return [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    case 'emboss':
      return [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  }

  // Default: identity kernel
  const center = Math.floor((size * size) / 2);
  const kernel = new Array(size * size).fill(0);
  kernel[center] = 1;
  return kernel;
}

/**
 * Apply convolution filter to image data
 */
export function applyConvolution(
  imageData: ImageData,
  kernel: number[],
  kernelSize = 3
): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;

      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const py = y + ky - half;
          const px = x + kx - half;

          // Handle edge cases by clamping
          const clampedY = Math.max(0, Math.min(height - 1, py));
          const clampedX = Math.max(0, Math.min(width - 1, px));

          const sourceIndex = (clampedY * width + clampedX) * 4;
          const kernelValue = kernel[ky * kernelSize + kx] || 0;

          r += (data[sourceIndex] || 0) * kernelValue;
          g += (data[sourceIndex + 1] || 0) * kernelValue;
          b += (data[sourceIndex + 2] || 0) * kernelValue;
        }
      }

      output[pixelIndex] = Math.max(0, Math.min(255, Math.round(r)));
      output[pixelIndex + 1] = Math.max(0, Math.min(255, Math.round(g)));
      output[pixelIndex + 2] = Math.max(0, Math.min(255, Math.round(b)));
      output[pixelIndex + 3] = data[pixelIndex + 3] || 255; // Preserve alpha
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Calculate image histogram
 */
export function calculateHistogram(imageData: ImageData): {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
} {
  const { data } = imageData;
  const red = new Array(256).fill(0);
  const green = new Array(256).fill(0);
  const blue = new Array(256).fill(0);
  const luminance = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    red[r]++;
    green[g]++;
    blue[b]++;

    // Calculate luminance using standard formula
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luminance[lum]++;
  }

  return { red, green, blue, luminance };
}

/**
 * Get image statistics
 */
export function getImageStatistics(imageData: ImageData): {
  mean: { r: number; g: number; b: number; luminance: number };
  std: { r: number; g: number; b: number; luminance: number };
  min: { r: number; g: number; b: number; luminance: number };
  max: { r: number; g: number; b: number; luminance: number };
} {
  const { data } = imageData;
  const pixelCount = data.length / 4;

  let sumR = 0,
    sumG = 0,
    sumB = 0,
    sumLum = 0;
  let minR = 255,
    minG = 255,
    minB = 255,
    minLum = 255;
  let maxR = 0,
    maxG = 0,
    maxB = 0,
    maxLum = 0;

  // Calculate means and min/max
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    sumR += r;
    sumG += g;
    sumB += b;
    sumLum += lum;

    minR = Math.min(minR, r);
    minG = Math.min(minG, g);
    minB = Math.min(minB, b);
    minLum = Math.min(minLum, lum);

    maxR = Math.max(maxR, r);
    maxG = Math.max(maxG, g);
    maxB = Math.max(maxB, b);
    maxLum = Math.max(maxLum, lum);
  }

  const meanR = sumR / pixelCount;
  const meanG = sumG / pixelCount;
  const meanB = sumB / pixelCount;
  const meanLum = sumLum / pixelCount;

  // Calculate standard deviations
  let sumSqR = 0,
    sumSqG = 0,
    sumSqB = 0,
    sumSqLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    sumSqR += Math.pow(r - meanR, 2);
    sumSqG += Math.pow(g - meanG, 2);
    sumSqB += Math.pow(b - meanB, 2);
    sumSqLum += Math.pow(lum - meanLum, 2);
  }

  const stdR = Math.sqrt(sumSqR / pixelCount);
  const stdG = Math.sqrt(sumSqG / pixelCount);
  const stdB = Math.sqrt(sumSqB / pixelCount);
  const stdLum = Math.sqrt(sumSqLum / pixelCount);

  return {
    mean: { r: meanR, g: meanG, b: meanB, luminance: meanLum },
    std: { r: stdR, g: stdG, b: stdB, luminance: stdLum },
    min: { r: minR, g: minG, b: minB, luminance: minLum },
    max: { r: maxR, g: maxG, b: maxB, luminance: maxLum },
  };
}

/**
 * Estimate memory usage for image processing
 */
export function estimateMemoryUsage(
  width: number,
  height: number
): {
  imageData: number;
  canvas: number;
  total: number;
  formatted: string;
} {
  const imageData = width * height * 4; // RGBA bytes
  const canvas = imageData * 2; // Estimated canvas overhead
  const total = imageData + canvas;

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return {
    imageData,
    canvas,
    total,
    formatted: formatBytes(total),
  };
}
