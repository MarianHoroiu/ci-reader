/**
 * Main Image Processing Pipeline
 * Comprehensive image preprocessing for Romanian ID extraction with LLaVA-7B
 */

import type {
  ImageProcessingOptions,
  ProcessingResult,
  ProcessingPipelineConfig,
  ImageQualityMetrics,
  RotationDetectionResult,
  LLaVAOptimalSpecs,
  RomanianIDLayoutSpecs,
} from '@/lib/types/image-processing-types';

import { validateImage } from '@/lib/utils/image-validation';
import {
  analyzeImageQuality,
  getQualityRecommendations,
} from '@/lib/utils/image-quality-analyzer';
import {
  detectRotation,
  correctImageRotation,
  quickRotationCheck,
} from '@/lib/utils/image-rotation-detector';

/**
 * LLaVA-7B optimal specifications
 */
export const LLAVA_OPTIMAL_SPECS: LLaVAOptimalSpecs = {
  width: 1024,
  height: 768,
  format: 'jpeg',
  quality: 0.9,
  maxSize: 5 * 1024 * 1024, // 5MB
  colorSpace: 'sRGB',
};

/**
 * Romanian ID card layout specifications
 */
export const ROMANIAN_ID_LAYOUT_SPECS: RomanianIDLayoutSpecs = {
  aspectRatio: 1.6,
  minWidth: 640,
  minHeight: 400,
  orientation: 'landscape',
  textRegions: [
    { name: 'name', x: 0.15, y: 0.2, width: 0.7, height: 0.15 },
    { name: 'cnp', x: 0.15, y: 0.4, width: 0.5, height: 0.1 },
    { name: 'birthDate', x: 0.15, y: 0.55, width: 0.3, height: 0.1 },
    { name: 'address', x: 0.15, y: 0.7, width: 0.7, height: 0.2 },
  ],
};

/**
 * Default processing options
 */
export const DEFAULT_PROCESSING_OPTIONS: ImageProcessingOptions = {
  targetWidth: LLAVA_OPTIMAL_SPECS.width,
  targetHeight: LLAVA_OPTIMAL_SPECS.height,
  quality: LLAVA_OPTIMAL_SPECS.quality,
  autoRotate: true,
  enhanceQuality: true,
  reduceNoise: true,
  maxFileSize: LLAVA_OPTIMAL_SPECS.maxSize,
  preserveAspectRatio: true,
};

/**
 * Processing pipeline configuration
 */
export const PROCESSING_CONFIG: ProcessingPipelineConfig = {
  llavaSpecs: LLAVA_OPTIMAL_SPECS,
  idLayoutSpecs: ROMANIAN_ID_LAYOUT_SPECS,
  defaultOptions: DEFAULT_PROCESSING_OPTIONS,
  performanceThresholds: {
    maxProcessingTime: 10000, // 10 seconds
    maxMemoryUsage: 100, // 100MB
    minQualityScore: 0.5,
  },
};

/**
 * Main image processing pipeline
 */
export async function processImageForAI(
  file: File,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessingResult> {
  const startTime = performance.now();
  const processingOptions = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  const transformations: string[] = [];
  const operationTimes: Record<string, number> = {};

  try {
    // Step 1: Validate image
    const validationStart = performance.now();
    const validation = await validateImage(file);
    operationTimes.validation = performance.now() - validationStart;

    if (!validation.isValid) {
      throw new Error(
        `Image validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Step 2: Analyze image quality
    const qualityStart = performance.now();
    const qualityMetrics = await analyzeImageQuality(file, validation.metadata);
    operationTimes.qualityAnalysis = performance.now() - qualityStart;

    // Step 3: Detect and correct rotation if needed
    let rotationResult: RotationDetectionResult | undefined;
    let processedImageData: string;

    if (processingOptions.autoRotate) {
      const rotationStart = performance.now();

      // Use quick check first for performance
      const quickCheck = quickRotationCheck(validation.metadata);

      if (quickCheck.shouldCorrect) {
        rotationResult = await detectRotation(file);

        if (rotationResult.shouldCorrect) {
          processedImageData = await correctImageRotation(
            file,
            rotationResult.angle
          );
          transformations.push(`rotation:${rotationResult.angle}deg`);
        } else {
          processedImageData = await fileToDataURL(file);
        }
      } else {
        processedImageData = await fileToDataURL(file);
      }

      operationTimes.rotation = performance.now() - rotationStart;
    } else {
      processedImageData = await fileToDataURL(file);
    }

    // Step 4: Resize and optimize for LLaVA
    const resizeStart = performance.now();
    const optimizedImage = await optimizeForLLaVA(
      processedImageData,
      processingOptions,
      validation.metadata
    );
    operationTimes.resize = performance.now() - resizeStart;
    transformations.push('resize', 'optimize');

    // Step 5: Apply quality enhancements if needed
    let finalImage = optimizedImage;

    if (processingOptions.enhanceQuality && qualityMetrics.overallScore < 0.7) {
      const enhanceStart = performance.now();
      finalImage = await enhanceImageQuality(optimizedImage, qualityMetrics);
      operationTimes.enhancement = performance.now() - enhanceStart;
      transformations.push('quality-enhancement');
    }

    // Step 6: Apply noise reduction if needed
    if (processingOptions.reduceNoise && qualityMetrics.noiseLevel > 0.5) {
      const noiseStart = performance.now();
      finalImage = await reduceNoise(finalImage);
      operationTimes.noiseReduction = performance.now() - noiseStart;
      transformations.push('noise-reduction');
    }

    // Calculate final metadata
    const processedMetadata = await getProcessedImageMetadata(finalImage);
    const totalTime = performance.now() - startTime;

    const result: ProcessingResult = {
      processedImage: finalImage,
      metadata: {
        original: validation.metadata,
        processed: processedMetadata,
        transformations,
        options: processingOptions,
        ...(rotationResult && { rotationCorrection: rotationResult }),
      },
      qualityMetrics,
      performance: {
        totalTime,
        operationTimes,
        memoryUsage: estimateMemoryUsage(
          validation.metadata,
          processedMetadata
        ),
        efficiency: calculateEfficiencyScore(
          totalTime,
          qualityMetrics.overallScore
        ),
      },
    };

    return result;
  } catch (error) {
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert file to data URL
 */
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimize image for LLaVA-7B
 */
async function optimizeForLLaVA(
  imageDataURL: string,
  options: ImageProcessingOptions,
  _originalMetadata: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Calculate optimal dimensions
        const { targetWidth, targetHeight } = calculateOptimalDimensions(
          img.width,
          img.height,
          options
        );

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Apply high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with optimal scaling
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to optimized format
        const quality = options.quality || 0.9;
        const optimizedDataURL = canvas.toDataURL('image/jpeg', quality);

        resolve(optimizedDataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for optimization'));
    img.src = imageDataURL;
  });
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ImageProcessingOptions
): { targetWidth: number; targetHeight: number } {
  const {
    targetWidth = 1024,
    targetHeight = 768,
    preserveAspectRatio = true,
  } = options;

  if (!preserveAspectRatio) {
    return { targetWidth, targetHeight };
  }

  const originalAspectRatio = originalWidth / originalHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  let finalWidth: number;
  let finalHeight: number;

  if (originalAspectRatio > targetAspectRatio) {
    // Image is wider than target - fit to width
    finalWidth = targetWidth;
    finalHeight = Math.round(targetWidth / originalAspectRatio);
  } else {
    // Image is taller than target - fit to height
    finalHeight = targetHeight;
    finalWidth = Math.round(targetHeight * originalAspectRatio);
  }

  return { targetWidth: finalWidth, targetHeight: finalHeight };
}

/**
 * Enhance contrast for better text extraction
 */
function enhanceContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Higher contrast factor for text extraction
  const factor = 2.0; // Increased from 1.5 to 2.0 for stronger contrast

  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    const r = data[i] || 0;
    const g = data[i + 1] || 0;
    const b = data[i + 2] || 0;

    // Convert to grayscale for text extraction
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Apply contrast adjustment
    const adjustedGray = 128 + factor * (gray - 128);

    // Apply stronger thresholding for text - good for OCR
    const threshold = 150;
    const binarized = adjustedGray > threshold ? 255 : 0;

    // Apply to all channels - makes text clearer against background
    data[i] = binarized;
    data[i + 1] = binarized;
    data[i + 2] = binarized;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sharpening filter for better OCR
 */
function applySharpeningFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Stronger sharpening kernel for text
  const kernel = [
    -1,
    -1,
    -1,
    -1,
    15,
    -1, // Increased center value from 9 to 15 for stronger sharpening
    -1,
    -1,
    -1,
  ];

  const kSize = 3;
  const kOffset = Math.floor(kSize / 2);

  // Apply the filter
  for (let y = kOffset; y < height - kOffset; y++) {
    for (let x = kOffset; x < width - kOffset; x++) {
      const offset = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;

        for (let ky = 0; ky < kSize; ky++) {
          for (let kx = 0; kx < kSize; kx++) {
            const kernelIdx = ky * kSize + kx;
            const kernelValue = kernel[kernelIdx] || 0;
            const pixelOffset =
              ((y + ky - kOffset) * width + (x + kx - kOffset)) * 4 + c;
            sum += (tempData[pixelOffset] || 0) * kernelValue;
          }
        }

        // Clamp values
        data[offset + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply OCR-specific optimizations
 * This improves text detection and extraction
 */
function applyOcrOptimizations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply adaptive thresholding - very effective for ID cards
  const blockSize = 25; // Size of neighborhood for adaptive threshold
  const C = 10; // Constant subtracted from mean

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;

      // Calculate local mean (simple box filter)
      let sum = 0;
      let count = 0;

      const xStart = Math.max(0, x - Math.floor(blockSize / 2));
      const xEnd = Math.min(width - 1, x + Math.floor(blockSize / 2));
      const yStart = Math.max(0, y - Math.floor(blockSize / 2));
      const yEnd = Math.min(height - 1, y + Math.floor(blockSize / 2));

      for (let ny = yStart; ny <= yEnd; ny++) {
        for (let nx = xStart; nx <= xEnd; nx++) {
          const neighborOffset = (ny * width + nx) * 4;
          sum += data[neighborOffset] || 0; // Use red channel as grayscale
          count++;
        }
      }

      const mean = sum / count;
      const threshold = mean - C;

      // Apply threshold
      const pixel = data[offset] || 0;
      const value = pixel < threshold ? 0 : 255;

      // Apply to all channels
      data[offset] = data[offset + 1] = data[offset + 2] = value;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Enhance image quality for better ID card text extraction
 */
async function enhanceImageQuality(
  imageDataURL: string,
  _qualityMetrics: ImageQualityMetrics // Renamed to _qualityMetrics to indicate it's not used
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Always apply these enhancements for ID card processing
        enhanceContrast(ctx, canvas.width, canvas.height);
        applySharpeningFilter(ctx, canvas.width, canvas.height);
        applyOcrOptimizations(ctx, canvas.width, canvas.height);

        // Convert back to data URL
        const enhancedDataURL = canvas.toDataURL('image/jpeg', 0.95);
        resolve(enhancedDataURL);
      } catch (error) {
        console.error('Error enhancing image:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Could not load image for enhancement'));
    };

    img.src = imageDataURL;
  });
}

/**
 * Reduce image noise
 */
async function reduceNoise(imageDataURL: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Apply simple noise reduction (Gaussian blur)
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';

        const denoisedDataURL = canvas.toDataURL('image/jpeg', 0.9);
        resolve(denoisedDataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for noise reduction'));
    img.src = imageDataURL;
  });
}

/**
 * Get metadata from processed image
 */
async function getProcessedImageMetadata(dataURL: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Estimate file size from data URL
      const base64Data = dataURL.split(',')[1];
      if (!base64Data) {
        reject(new Error('Invalid data URL format'));
        return;
      }

      const fileSize = Math.round((base64Data.length * 3) / 4);

      resolve({
        width: img.width,
        height: img.height,
        fileSize,
        format: 'image/jpeg',
        colorDepth: 24,
        hasAlpha: false,
        aspectRatio: img.width / img.height,
      });
    };

    img.onerror = () => reject(new Error('Failed to load processed image'));
    img.src = dataURL;
  });
}

/**
 * Estimate memory usage
 */
function estimateMemoryUsage(original: any, processed: any): number {
  const originalSize = (original.width * original.height * 4) / (1024 * 1024); // RGBA in MB
  const processedSize =
    (processed.width * processed.height * 4) / (1024 * 1024);
  return Math.max(originalSize, processedSize) * 2; // Account for temporary canvases
}

/**
 * Calculate processing efficiency score
 */
function calculateEfficiencyScore(
  processingTime: number,
  qualityScore: number
): number {
  const timeScore = Math.max(0, 1 - processingTime / 10000); // Penalize long processing times
  return timeScore * 0.3 + qualityScore * 0.7; // Weight quality more than speed
}

/**
 * Batch process multiple images
 */
export async function batchProcessImages(
  files: File[],
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const file of files) {
    try {
      const result = await processImageForAI(file, options);
      results.push(result);
    } catch (error) {
      // Continue processing other images even if one fails
      console.error(`Failed to process ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Get processing recommendations based on image analysis
 */
export async function getProcessingRecommendations(file: File): Promise<{
  recommendations: string[];
  suggestedOptions: Partial<ImageProcessingOptions>;
}> {
  const validation = await validateImage(file);

  if (!validation.isValid) {
    return {
      recommendations: validation.errors,
      suggestedOptions: {},
    };
  }

  const qualityMetrics = await analyzeImageQuality(file, validation.metadata);
  const recommendations = getQualityRecommendations(qualityMetrics);

  const suggestedOptions: Partial<ImageProcessingOptions> = {
    enhanceQuality: qualityMetrics.overallScore < 0.7,
    reduceNoise: qualityMetrics.noiseLevel > 0.5,
    autoRotate: validation.metadata.aspectRatio < 1.0,
  };

  return {
    recommendations,
    suggestedOptions,
  };
}
