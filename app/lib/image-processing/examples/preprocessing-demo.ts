/**
 * Demonstration of image preprocessing pipeline usage
 * Shows various ways to use the preprocessing system
 */

import {
  PreprocessingPipeline,
  preprocessImage,
  preprocessRomanianID,
} from '../preprocessing-pipeline';
import {
  DEFAULT_PREPROCESSING_CONFIG,
  ROMANIAN_ID_PREPROCESSING_CONFIG,
} from '../types/preprocessing-types';
import { checkCanvasCompatibility } from '../utils/canvas-utils';
import { analyzeImage } from '../utils/image-analysis';
import type {
  PreprocessingProgress,
  PreprocessingResult,
  ImageInput,
} from '../types/preprocessing-types';

/**
 * Example 1: Basic image preprocessing with default settings
 */
export async function basicPreprocessingExample(
  imageInput: ImageInput
): Promise<PreprocessingResult> {
  console.log('🔄 Starting basic preprocessing...');

  const result = await preprocessImage(imageInput, {
    onProgress: (progress: PreprocessingProgress) => {
      console.log(
        `📊 ${progress.stage}: ${progress.progress.toFixed(1)}% - ${progress.message}`
      );
    },
  });

  console.log('✅ Basic preprocessing completed:', {
    success: result.success,
    operations: result.operations,
    processingTime: `${result.processingTime}ms`,
    qualityScore: result.qualityMetrics.overall.toFixed(2),
  });

  return result;
}

/**
 * Example 2: Romanian ID document preprocessing with optimized settings
 */
export async function romanianIdPreprocessingExample(
  imageInput: ImageInput
): Promise<PreprocessingResult> {
  console.log('🆔 Starting Romanian ID preprocessing...');

  const result = await preprocessRomanianID(
    imageInput,
    (progress: PreprocessingProgress) => {
      console.log(
        `📊 ${progress.stage}: ${progress.progress.toFixed(1)}% - ${progress.message}`
      );
    }
  );

  console.log('✅ Romanian ID preprocessing completed:', {
    success: result.success,
    operations: result.operations,
    processingTime: `${result.processingTime}ms`,
    qualityScore: result.qualityMetrics.overall.toFixed(2),
    rotationAngle: result.rotationAngle
      ? `${result.rotationAngle.toFixed(2)}°`
      : 'None',
  });

  return result;
}

/**
 * Example 3: Custom preprocessing pipeline with specific operations
 */
export async function customPreprocessingExample(
  imageInput: ImageInput
): Promise<PreprocessingResult> {
  console.log('⚙️ Starting custom preprocessing...');

  const pipeline = new PreprocessingPipeline({
    config: {
      grayscale: {
        enabled: true,
        method: 'luminance',
        preserveAlpha: true,
      },
      contrast: {
        enabled: true,
        factor: 1.8,
        adaptive: true,
        clipLimit: 3.0,
      },
      noiseReduction: {
        enabled: true,
        method: 'bilateral',
        kernelSize: 5,
        strength: 0.8,
      },
      rotationCorrection: {
        enabled: true,
        maxAngle: 20,
        method: 'hough',
        precision: 0.25,
      },
      sharpening: {
        enabled: true,
        method: 'unsharp_mask',
        strength: 0.6,
        radius: 1.5,
      },
    },
    onProgress: (progress: PreprocessingProgress) => {
      console.log(
        `📊 ${progress.stage}: ${progress.progress.toFixed(1)}% - ${progress.message}`
      );
    },
    onError: (error: Error) => {
      console.error('❌ Preprocessing error:', error.message);
    },
  });

  const result = await pipeline.processImage(imageInput, {
    outputFormat: 'png',
    outputQuality: 1.0,
    maxDimensions: { width: 2048, height: 2048 },
    preserveAspectRatio: true,
  });

  console.log('✅ Custom preprocessing completed:', {
    success: result.success,
    operations: result.operations,
    processingTime: `${result.processingTime}ms`,
    qualityMetrics: {
      overall: result.qualityMetrics.overall.toFixed(2),
      sharpness: result.qualityMetrics.sharpness.toFixed(2),
      contrast: result.qualityMetrics.contrast.toFixed(2),
      textReadability: result.qualityMetrics.textReadability.toFixed(2),
    },
  });

  return result;
}

/**
 * Example 4: Image analysis and quality assessment
 */
export async function imageAnalysisExample(
  imageInput: ImageInput
): Promise<void> {
  console.log('🔍 Starting image analysis...');

  try {
    // Check browser compatibility first
    const compatibility = checkCanvasCompatibility();
    console.log('🌐 Browser compatibility:', {
      canvas2D: compatibility.canvas2D,
      webWorkers: compatibility.webWorkers,
      supportedFormats: compatibility.supportedFormats,
      maxCanvasSize: compatibility.maxCanvasSize,
    });

    if (!compatibility.canvas2D) {
      console.error('❌ Canvas 2D not supported in this environment');
      return;
    }

    // Create canvas context for analysis
    const { createCanvasContext } = await import('../utils/canvas-utils');
    const context = await createCanvasContext(imageInput);

    // Analyze image
    const analysis = analyzeImage(context);

    console.log('📊 Image analysis results:', {
      dimensions: `${analysis.dimensions.width}x${analysis.dimensions.height}`,
      format: analysis.format,
      size: `${(analysis.size / 1024).toFixed(1)} KB`,
      isDocumentImage: analysis.isDocumentImage,
      detectedRotation: `${analysis.detectedRotation.toFixed(2)}°`,
      suitabilityScore: analysis.suitabilityScore.toFixed(2),
      qualityMetrics: {
        overall: analysis.qualityMetrics.overall.toFixed(2),
        sharpness: analysis.qualityMetrics.sharpness.toFixed(2),
        contrast: analysis.qualityMetrics.contrast.toFixed(2),
        brightness: analysis.qualityMetrics.brightness.toFixed(2),
        noise: analysis.qualityMetrics.noise.toFixed(2),
        textReadability: analysis.qualityMetrics.textReadability.toFixed(2),
      },
      recommendedOperations: analysis.recommendedOperations,
    });
  } catch (error) {
    console.error('❌ Image analysis failed:', error);
  }
}

/**
 * Example 5: Batch processing multiple images
 */
export async function batchPreprocessingExample(
  imageInputs: ImageInput[]
): Promise<PreprocessingResult[]> {
  console.log(
    `📦 Starting batch preprocessing of ${imageInputs.length} images...`
  );

  const results: PreprocessingResult[] = [];

  for (let i = 0; i < imageInputs.length; i++) {
    const imageInput = imageInputs[i];
    if (!imageInput) {
      console.error(`❌ Image ${i + 1} is undefined, skipping...`);
      continue;
    }

    console.log(`🔄 Processing image ${i + 1}/${imageInputs.length}...`);

    try {
      const result = await preprocessRomanianID(imageInput);
      results.push(result);

      console.log(`✅ Image ${i + 1} completed:`, {
        success: result.success,
        operations: result.operations.length,
        processingTime: `${result.processingTime}ms`,
        qualityScore: result.qualityMetrics.overall.toFixed(2),
      });
    } catch (error) {
      console.error(`❌ Image ${i + 1} failed:`, error);
      // Add failed result
      results.push({
        processedImage: typeof imageInput === 'string' ? imageInput : '',
        originalImage: imageInput,
        operations: [],
        qualityMetrics: {
          sharpness: 0,
          contrast: 0,
          brightness: 0,
          noise: 1,
          overall: 0,
          textReadability: 0,
        },
        processingTime: 0,
        config: DEFAULT_PREPROCESSING_CONFIG,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const avgProcessingTime =
    results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.processingTime, 0) / successCount;

  console.log('📊 Batch processing summary:', {
    totalImages: imageInputs.length,
    successful: successCount,
    failed: imageInputs.length - successCount,
    avgProcessingTime: `${avgProcessingTime.toFixed(0)}ms`,
  });

  return results;
}

/**
 * Example 6: Configuration comparison
 */
export async function configurationComparisonExample(
  imageInput: ImageInput
): Promise<void> {
  console.log('⚖️ Comparing different preprocessing configurations...');

  const configurations = [
    { name: 'Default', config: DEFAULT_PREPROCESSING_CONFIG },
    { name: 'Romanian ID', config: ROMANIAN_ID_PREPROCESSING_CONFIG },
    {
      name: 'High Quality',
      config: {
        grayscale: { enabled: true, method: 'luminance' as const },
        contrast: { enabled: true, factor: 2.0, adaptive: true },
        noiseReduction: {
          enabled: true,
          method: 'bilateral' as const,
          strength: 0.9,
        },
        rotationCorrection: { enabled: true, maxAngle: 25, precision: 0.1 },
        sharpening: {
          enabled: true,
          method: 'unsharp_mask' as const,
          strength: 0.8,
        },
      },
    },
    {
      name: 'Fast Processing',
      config: {
        grayscale: { enabled: true, method: 'average' as const },
        contrast: { enabled: true, factor: 1.3, adaptive: false },
        noiseReduction: {
          enabled: true,
          method: 'median' as const,
          kernelSize: 3,
        },
        rotationCorrection: { enabled: false },
        sharpening: { enabled: false },
      },
    },
  ];

  for (const { name, config } of configurations) {
    console.log(`🔄 Testing ${name} configuration...`);

    try {
      const startTime = Date.now();
      const result = await preprocessImage(imageInput, { config });
      const endTime = Date.now();

      console.log(`✅ ${name} results:`, {
        success: result.success,
        operations: result.operations,
        processingTime: `${endTime - startTime}ms`,
        qualityScore: result.qualityMetrics.overall.toFixed(2),
        sharpness: result.qualityMetrics.sharpness.toFixed(2),
        contrast: result.qualityMetrics.contrast.toFixed(2),
        textReadability: result.qualityMetrics.textReadability.toFixed(2),
      });
    } catch (error) {
      console.error(`❌ ${name} configuration failed:`, error);
    }
  }
}

/**
 * Utility function to create a test canvas for demonstrations
 */
export function createTestCanvas(
  width = 400,
  height = 300,
  text = 'Sample Romanian ID Text\nNume: POPESCU MARIA\nCNP: 1234567890123'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // Create a document-like background
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, width, height);

  // Add some noise
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
  }

  // Add text content
  ctx.fillStyle = '#333333';
  ctx.font = '16px Arial';
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    ctx.fillText(line, 20, 50 + index * 25);
  });

  // Add some rotation (simulate skewed document)
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((Math.random() - 0.5) * 0.1); // Small random rotation
  ctx.fillStyle = '#666666';
  ctx.font = '12px Arial';
  ctx.fillText('Additional rotated text', -100, 50);
  ctx.restore();

  return canvas;
}

/**
 * Run all examples with a test image
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running all preprocessing examples...');

  // Create test image
  const testCanvas = createTestCanvas();

  try {
    // Example 1: Basic preprocessing
    await basicPreprocessingExample(testCanvas);
    console.log('---');

    // Example 2: Romanian ID preprocessing
    await romanianIdPreprocessingExample(testCanvas);
    console.log('---');

    // Example 3: Custom preprocessing
    await customPreprocessingExample(testCanvas);
    console.log('---');

    // Example 4: Image analysis
    await imageAnalysisExample(testCanvas);
    console.log('---');

    // Example 5: Batch processing
    const testImages = [
      testCanvas,
      createTestCanvas(300, 200),
      createTestCanvas(500, 400),
    ];
    await batchPreprocessingExample(testImages);
    console.log('---');

    // Example 6: Configuration comparison
    await configurationComparisonExample(testCanvas);

    console.log('🎉 All examples completed successfully!');
  } catch (error) {
    console.error('❌ Examples failed:', error);
  }
}
