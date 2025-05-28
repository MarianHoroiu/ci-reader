/**
 * Main Image Processing Pipeline
 * Comprehensive image preprocessing for Romanian ID extraction with Qwen2.5-VL-7B-Instruct
 */

import type {
  ImageProcessingOptions,
  ProcessingResult,
  ProcessingPipelineConfig,
  ImageQualityMetrics,
  RotationDetectionResult,
  ImageValidationResult,
  PerformanceMetrics,
  ProcessingMetadata,
  QwenOptimalSpecs,
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
 * Qwen2.5-VL-7B-Instruct optimal specifications
 */
export const QWEN_OPTIMAL_SPECS: QwenOptimalSpecs = {
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
  targetWidth: QWEN_OPTIMAL_SPECS.width,
  targetHeight: QWEN_OPTIMAL_SPECS.height,
  quality: QWEN_OPTIMAL_SPECS.quality,
  autoRotate: true,
  enhanceQuality: true,
  reduceNoise: true,
  maxFileSize: QWEN_OPTIMAL_SPECS.maxSize,
  preserveAspectRatio: true,
};

/**
 * Processing pipeline configuration
 */
export const PROCESSING_CONFIG: ProcessingPipelineConfig = {
  qwenSpecs: QWEN_OPTIMAL_SPECS,
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

    // Step 4: Resize and optimize for Qwen
    const resizeStart = performance.now();
    const optimizedImage = await optimizeForQwen(
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
 * Optimize image for Qwen2.5-VL-7B-Instruct
 */
async function optimizeForQwen(
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
 * Enhance image quality based on quality metrics
 */
async function enhanceImageQuality(
  imageDataURL: string,
  qualityMetrics: ImageQualityMetrics
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

        // Apply enhancements based on quality metrics
        if (qualityMetrics.contrast < 0.5) {
          enhanceContrast(ctx, canvas.width, canvas.height);
        }

        if (
          qualityMetrics.brightness < 0.4 ||
          qualityMetrics.brightness > 0.8
        ) {
          adjustBrightness(
            ctx,
            canvas.width,
            canvas.height,
            qualityMetrics.brightness
          );
        }

        if (qualityMetrics.sharpness < 0.5) {
          applySharpeningFilter(ctx, canvas.width, canvas.height);
        }

        const enhancedDataURL = canvas.toDataURL('image/jpeg', 0.9);
        resolve(enhancedDataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for enhancement'));
    img.src = imageDataURL;
  });
}

/**
 * Enhance image contrast
 */
function enhanceContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const factor = 1.3; // Contrast enhancement factor

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast enhancement to RGB channels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      data[i] = Math.min(255, Math.max(0, (r - 128) * factor + 128)); // Red
      data[i + 1] = Math.min(255, Math.max(0, (g - 128) * factor + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (b - 128) * factor + 128)); // Blue
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Adjust image brightness
 */
function adjustBrightness(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentBrightness: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate brightness adjustment
  const targetBrightness = 0.6; // Optimal brightness
  const adjustment = (targetBrightness - currentBrightness) * 50;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r !== undefined && g !== undefined && b !== undefined) {
      data[i] = Math.min(255, Math.max(0, r + adjustment)); // Red
      data[i + 1] = Math.min(255, Math.max(0, g + adjustment)); // Green
      data[i + 2] = Math.min(255, Math.max(0, b + adjustment)); // Blue
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sharpening filter
 */
function applySharpeningFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        // RGB channels
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelRow = kernel[ky + 1];
            const pixelValue = data[pixelIndex];
            const kernelValue = kernelRow?.[kx + 1];

            if (pixelValue !== undefined && kernelValue !== undefined) {
              sum += pixelValue * kernelValue;
            }
          }
        }

        const currentIndex = (y * width + x) * 4 + c;
        newData[currentIndex] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  const newImageData = new ImageData(newData, width, height);
  ctx.putImageData(newImageData, 0, 0);
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
