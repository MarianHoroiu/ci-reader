/**
 * Main image preprocessing pipeline
 * Orchestrates all preprocessing operations for optimal OCR results
 */

import type {
  ImageInput,
  PreprocessingResult,
  PreprocessingProgress,
  PreprocessingPipelineOptions,
  PreprocessingConfig,
  PreprocessingOperation,
  CanvasProcessingContext,
} from './types/preprocessing-types';

import {
  createCanvasContext,
  canvasToOutput,
  checkCanvasCompatibility,
} from './utils/canvas-utils';

import { analyzeImage, calculateQualityMetrics } from './utils/image-analysis';
import { applyGrayscaleConversion } from './filters/grayscale-conversion';
import { applyContrastEnhancement } from './filters/contrast-enhancement';
import { applyNoiseReduction } from './filters/noise-reduction';
import { applyRotationCorrection } from './filters/rotation-correction';

import {
  DEFAULT_PREPROCESSING_CONFIG,
  ROMANIAN_ID_PREPROCESSING_CONFIG,
} from './types/preprocessing-types';

/**
 * Main preprocessing pipeline class
 */
export class PreprocessingPipeline {
  private config: PreprocessingConfig;
  private onProgress: ((_progress: PreprocessingProgress) => void) | undefined;
  private onError: ((_error: Error) => void) | undefined;

  constructor(options: PreprocessingPipelineOptions = {}) {
    this.config = { ...DEFAULT_PREPROCESSING_CONFIG, ...options.config };
    this.onProgress = options.onProgress;
    this.onError = options.onError;
  }

  /**
   * Process image through the preprocessing pipeline
   */
  async processImage(
    imageInput: ImageInput,
    options: PreprocessingPipelineOptions = {}
  ): Promise<PreprocessingResult> {
    const startTime = Date.now();
    const operations: PreprocessingOperation[] = [];
    const errors: string[] = [];

    try {
      // Check browser compatibility
      const compatibility = checkCanvasCompatibility();
      if (!compatibility.canvas2D) {
        throw new Error('Canvas 2D not supported in this browser');
      }

      // Merge configuration
      const config = { ...this.config, ...options.config };

      // Report initialization
      this.reportProgress(
        'initialization',
        'initialization',
        0,
        'Initializing preprocessing pipeline...'
      );

      // Create canvas context
      const context = await createCanvasContext(
        imageInput,
        options.maxDimensions
      );

      // Analyze image quality
      analyzeImage(context);
      this.reportProgress(
        'analysis',
        'initialization',
        10,
        'Analyzing image quality...'
      );

      // Apply preprocessing operations in order
      let currentProgress = 20;
      const totalOperations = this.getEnabledOperationsCount(config);
      const progressPerOperation = 70 / totalOperations;

      // 1. Grayscale conversion (if enabled)
      if (config.grayscale?.enabled) {
        this.reportProgress(
          'grayscale',
          'grayscale',
          currentProgress,
          'Converting to grayscale...'
        );
        applyGrayscaleConversion(context, config.grayscale);
        operations.push('grayscale');
        currentProgress += progressPerOperation;
      }

      // 2. Rotation correction (if enabled)
      if (config.rotationCorrection?.enabled) {
        this.reportProgress(
          'rotation',
          'rotation_correction',
          currentProgress,
          'Correcting rotation...'
        );
        const rotationAngle = applyRotationCorrection(
          context,
          config.rotationCorrection
        );
        if (Math.abs(rotationAngle) > 0.1) {
          operations.push('rotation_correction');
        }
        currentProgress += progressPerOperation;
      }

      // 3. Noise reduction (if enabled)
      if (config.noiseReduction?.enabled) {
        this.reportProgress(
          'noise_reduction',
          'noise_reduction',
          currentProgress,
          'Reducing noise...'
        );
        applyNoiseReduction(context, config.noiseReduction);
        operations.push('noise_reduction');
        currentProgress += progressPerOperation;
      }

      // 4. Contrast enhancement (if enabled)
      if (config.contrast?.enabled) {
        this.reportProgress(
          'contrast',
          'contrast_enhancement',
          currentProgress,
          'Enhancing contrast...'
        );
        applyContrastEnhancement(context, config.contrast);
        operations.push('contrast_enhancement');
        currentProgress += progressPerOperation;
      }

      // 5. Brightness adjustment (if enabled)
      if (config.brightness?.enabled) {
        this.reportProgress(
          'brightness',
          'brightness_adjustment',
          currentProgress,
          'Adjusting brightness...'
        );
        this.applyBrightnessAdjustment(context, config.brightness);
        operations.push('brightness_adjustment');
        currentProgress += progressPerOperation;
      }

      // 6. Sharpening (if enabled)
      if (config.sharpening?.enabled) {
        this.reportProgress(
          'sharpening',
          'sharpening',
          currentProgress,
          'Applying sharpening...'
        );
        this.applySharpening(context, config.sharpening);
        operations.push('sharpening');
        currentProgress += progressPerOperation;
      }

      // Calculate final quality metrics
      this.reportProgress(
        'finalization',
        'finalization',
        90,
        'Calculating quality metrics...'
      );
      const qualityMetrics = calculateQualityMetrics(context.imageData);

      // Generate output
      this.reportProgress('output', 'finalization', 95, 'Generating output...');
      const outputFormat = options.outputFormat || 'png';
      const outputQuality = options.outputQuality || 0.9;
      const processedImage = canvasToOutput(
        context.canvas,
        outputFormat,
        outputQuality
      );

      // Complete
      this.reportProgress(
        'complete',
        'finalization',
        100,
        'Preprocessing complete'
      );

      const result: PreprocessingResult = {
        processedImage,
        originalImage: imageInput,
        operations,
        qualityMetrics,
        processingTime: Date.now() - startTime,
        config,
        success: true,
        ...(errors.length > 0 && { errors }),
      };

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown preprocessing error';
      errors.push(errorMessage);

      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(errorMessage));
      }

      // Return failed result
      return {
        processedImage: typeof imageInput === 'string' ? imageInput : '',
        originalImage: imageInput,
        operations,
        qualityMetrics: {
          sharpness: 0,
          contrast: 0,
          brightness: 0,
          noise: 1,
          overall: 0,
          textReadability: 0,
        },
        processingTime: Date.now() - startTime,
        config: this.config,
        success: false,
        errors,
      };
    }
  }

  /**
   * Process image specifically for Romanian ID documents
   */
  async processRomanianID(
    imageInput: ImageInput
  ): Promise<PreprocessingResult> {
    return this.processImage(imageInput, {
      config: ROMANIAN_ID_PREPROCESSING_CONFIG,
      outputFormat: 'png',
      outputQuality: 1.0,
    });
  }

  /**
   * Apply brightness adjustment
   */
  private applyBrightnessAdjustment(
    context: CanvasProcessingContext,
    config: PreprocessingConfig['brightness']
  ): void {
    if (!config?.enabled) return;

    const { context: ctx, imageData, width, height } = context;
    const data = imageData.data;

    let adjustment = config.adjustment || 0;

    // Auto-adjust if enabled
    if (config.autoAdjust) {
      const stats = this.calculateBrightnessStats(data);
      const targetBrightness = 128; // Target middle brightness
      adjustment = targetBrightness - stats.mean;
      // Limit adjustment to reasonable range
      adjustment = Math.max(-50, Math.min(50, adjustment));
    }

    // Apply brightness adjustment
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const value = (data[i + c] || 0) + adjustment;
        data[i + c] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }

    ctx.putImageData(imageData, 0, 0);
    context.imageData = ctx.getImageData(0, 0, width, height);
  }

  /**
   * Apply sharpening filter
   */
  private applySharpening(
    context: CanvasProcessingContext,
    config: PreprocessingConfig['sharpening']
  ): void {
    if (!config?.enabled) return;

    const { context: ctx, imageData, width, height } = context;
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data.length);
    const strength = config.strength || 0.5;
    const method = config.method || 'unsharp_mask';

    // Copy original data
    newData.set(data);

    if (method === 'unsharp_mask') {
      // Unsharp mask sharpening
      const radius = config.radius || 1;
      this.applyUnsharpMask(data, newData, width, height, strength, radius);
    } else if (method === 'laplacian') {
      // Laplacian sharpening
      this.applyLaplacianSharpening(data, newData, width, height, strength);
    }

    const processedImageData = new ImageData(newData, width, height);
    ctx.putImageData(processedImageData, 0, 0);
    context.imageData = ctx.getImageData(0, 0, width, height);
  }

  /**
   * Apply unsharp mask sharpening
   */
  private applyUnsharpMask(
    originalData: Uint8ClampedArray,
    newData: Uint8ClampedArray,
    width: number,
    height: number,
    strength: number,
    radius: number
  ): void {
    // Create blurred version (simplified Gaussian blur)
    const blurredData = new Uint8ClampedArray(originalData.length);
    blurredData.set(originalData);

    // Simple box blur approximation
    const kernelSize = Math.max(3, radius * 2 + 1);
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        const pixelIndex = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let count = 0;

          for (let dy = -half; dy <= half; dy++) {
            for (let dx = -half; dx <= half; dx++) {
              const neighborIndex = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += originalData[neighborIndex] || 0;
              count++;
            }
          }

          blurredData[pixelIndex + c] = Math.round(sum / count);
        }
      }
    }

    // Apply unsharp mask: original + strength * (original - blurred)
    for (let i = 0; i < originalData.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const original = originalData[i + c] || 0;
        const blurred = blurredData[i + c] || 0;
        const sharpened = original + strength * (original - blurred);
        newData[i + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  /**
   * Apply Laplacian sharpening
   */
  private applyLaplacianSharpening(
    originalData: Uint8ClampedArray,
    newData: Uint8ClampedArray,
    width: number,
    height: number,
    strength: number
  ): void {
    // Laplacian kernel
    const kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelIndex = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          let laplacian = 0;

          for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
              const py = y + ky - 1;
              const px = x + kx - 1;
              const idx = (py * width + px) * 4 + c;
              laplacian +=
                (originalData[idx] || 0) * (kernel[ky * 3 + kx] || 0);
            }
          }

          const original = originalData[pixelIndex + c] || 0;
          const sharpened = original + strength * laplacian;
          newData[pixelIndex + c] = Math.max(
            0,
            Math.min(255, Math.round(sharpened))
          );
        }
      }
    }
  }

  /**
   * Calculate brightness statistics
   */
  private calculateBrightnessStats(data: Uint8ClampedArray): {
    mean: number;
    std: number;
  } {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray =
        0.299 * (data[i] || 0) +
        0.587 * (data[i + 1] || 0) +
        0.114 * (data[i + 2] || 0);
      sum += gray;
      count++;
    }

    const mean = sum / count;

    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        0.299 * (data[i] || 0) +
        0.587 * (data[i + 1] || 0) +
        0.114 * (data[i + 2] || 0);
      sumSquares += Math.pow(gray - mean, 2);
    }

    const std = Math.sqrt(sumSquares / count);
    return { mean, std };
  }

  /**
   * Count enabled operations for progress calculation
   */
  private getEnabledOperationsCount(config: PreprocessingConfig): number {
    let count = 0;
    if (config.grayscale?.enabled) count++;
    if (config.rotationCorrection?.enabled) count++;
    if (config.noiseReduction?.enabled) count++;
    if (config.contrast?.enabled) count++;
    if (config.brightness?.enabled) count++;
    if (config.sharpening?.enabled) count++;
    return Math.max(1, count); // Avoid division by zero
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    stage: string,
    operation: PreprocessingOperation | 'initialization' | 'finalization',
    progress: number,
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({
        stage,
        operation,
        progress: Math.max(0, Math.min(100, progress)),
        message,
      });
    }
  }
}

/**
 * Convenience function to process image with default settings
 */
export async function preprocessImage(
  imageInput: ImageInput,
  options: PreprocessingPipelineOptions = {}
): Promise<PreprocessingResult> {
  const pipeline = new PreprocessingPipeline(options);
  return pipeline.processImage(imageInput, options);
}

/**
 * Convenience function to process Romanian ID with optimized settings
 */
export async function preprocessRomanianID(
  imageInput: ImageInput,
  onProgress?: (_progress: PreprocessingProgress) => void
): Promise<PreprocessingResult> {
  const options: PreprocessingPipelineOptions = {};
  if (onProgress) {
    options.onProgress = onProgress;
  }
  const pipeline = new PreprocessingPipeline(options);
  return pipeline.processRomanianID(imageInput);
}
