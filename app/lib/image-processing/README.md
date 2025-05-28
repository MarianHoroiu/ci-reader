# Image Preprocessing Pipeline

A comprehensive image preprocessing system designed to enhance image quality for optimal OCR
(Optical Character Recognition) results, specifically optimized for Romanian ID document processing.

## Features

### 🎯 Core Capabilities

- **Grayscale Conversion** - Multiple methods (luminance, average, desaturation)
- **Contrast Enhancement** - Linear and adaptive (CLAHE) enhancement
- **Noise Reduction** - Median, Gaussian, and bilateral filtering
- **Rotation Correction** - Automatic skew detection and correction
- **Brightness Adjustment** - Manual and automatic brightness optimization
- **Sharpening** - Unsharp mask and Laplacian sharpening
- **Quality Analysis** - Comprehensive image quality metrics

### 🚀 Advanced Features

- **Progress Reporting** - Real-time processing progress updates
- **Error Handling** - Comprehensive error recovery and reporting
- **Browser Compatibility** - Automatic feature detection and fallbacks
- **Multiple Input Formats** - Support for various image input types
- **Configurable Pipeline** - Flexible configuration system
- **Romanian ID Optimization** - Specialized settings for ID documents

## Installation

The preprocessing pipeline is part of the OCR system and doesn't require separate installation. It's
automatically available when you import the OCR module.

## Quick Start

### Basic Usage

```typescript
import { preprocessImage } from '@/lib/image-processing';

// Basic preprocessing with default settings
const result = await preprocessImage(imageInput, {
  onProgress: progress => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  },
});

if (result.success) {
  console.log('Processed image:', result.processedImage);
  console.log('Quality score:', result.qualityMetrics.overall);
}
```

### Romanian ID Processing

```typescript
import { preprocessRomanianID } from '@/lib/image-processing';

// Optimized preprocessing for Romanian ID documents
const result = await preprocessRomanianID(imageInput, progress =>
  console.log(`Processing: ${progress.progress}%`)
);
```

### Custom Configuration

```typescript
import { PreprocessingPipeline } from '@/lib/image-processing';

const pipeline = new PreprocessingPipeline({
  config: {
    grayscale: { enabled: true, method: 'luminance' },
    contrast: { enabled: true, factor: 1.5, adaptive: true },
    noiseReduction: { enabled: true, method: 'bilateral' },
    rotationCorrection: { enabled: true, maxAngle: 15 },
    sharpening: { enabled: true, strength: 0.5 },
  },
  onProgress: progress => console.log(progress),
  onError: error => console.error(error),
});

const result = await pipeline.processImage(imageInput);
```

## Configuration Options

### Grayscale Conversion

```typescript
grayscale: {
  enabled: boolean; // Enable/disable grayscale conversion
  method: 'luminance' | 'average' | 'desaturation';
  preserveAlpha: boolean; // Preserve alpha channel
}
```

**Methods:**

- `luminance` - Standard ITU-R BT.709 formula (recommended for text)
- `average` - Simple RGB average
- `desaturation` - Average of min and max RGB values

### Contrast Enhancement

```typescript
contrast: {
  enabled: boolean; // Enable/disable contrast enhancement
  factor: number; // Linear contrast factor (1.0 = no change)
  adaptive: boolean; // Use adaptive histogram equalization (CLAHE)
  clipLimit: number; // Clip limit for adaptive enhancement
}
```

### Noise Reduction

```typescript
noiseReduction: {
  enabled: boolean; // Enable/disable noise reduction
  method: 'median' | 'gaussian' | 'bilateral';
  kernelSize: number; // Filter kernel size (3, 5, 7, etc.)
  strength: number; // Filter strength (0.0 - 1.0)
}
```

**Methods:**

- `median` - Good for salt-and-pepper noise
- `gaussian` - General purpose smoothing
- `bilateral` - Edge-preserving noise reduction (recommended)

### Rotation Correction

```typescript
rotationCorrection: {
  enabled: boolean; // Enable/disable rotation correction
  maxAngle: number; // Maximum rotation angle to detect (degrees)
  method: 'hough' | 'projection' | 'edge_detection';
  precision: number; // Detection precision (degrees)
}
```

### Brightness Adjustment

```typescript
brightness: {
  enabled: boolean; // Enable/disable brightness adjustment
  adjustment: number; // Manual brightness adjustment (-255 to 255)
  autoAdjust: boolean; // Automatic brightness optimization
}
```

### Sharpening

```typescript
sharpening: {
  enabled: boolean; // Enable/disable sharpening
  method: 'unsharp_mask' | 'laplacian' | 'high_pass';
  strength: number; // Sharpening strength (0.0 - 1.0)
  radius: number; // Sharpening radius
}
```

## Configuration Presets

### Default Configuration

Balanced settings suitable for most document images:

```typescript
import { DEFAULT_PREPROCESSING_CONFIG } from '@/lib/image-processing';
```

### Romanian ID Configuration

Optimized specifically for Romanian ID documents:

```typescript
import { ROMANIAN_ID_PREPROCESSING_CONFIG } from '@/lib/image-processing';
```

## Input Formats

The preprocessing pipeline supports multiple input formats:

```typescript
type ImageInput =
  | string // Data URL or image URL
  | File // File object from input
  | ImageData // Canvas ImageData
  | HTMLCanvasElement // Canvas element
  | HTMLImageElement; // Image element
```

## Output Formats

```typescript
// Configure output format
const result = await preprocessImage(imageInput, {
  outputFormat: 'png' | 'jpeg' | 'webp',
  outputQuality: 0.9, // Quality for lossy formats (0.0 - 1.0)
});
```

## Quality Metrics

The preprocessing pipeline provides comprehensive quality analysis:

```typescript
interface ImageQualityMetrics {
  sharpness: number; // Image sharpness (0.0 - 1.0)
  contrast: number; // Image contrast (0.0 - 1.0)
  brightness: number; // Image brightness (0.0 - 1.0)
  noise: number; // Noise level (0.0 - 1.0)
  overall: number; // Overall quality score (0.0 - 1.0)
  textReadability: number; // Text readability score (0.0 - 1.0)
}
```

## Progress Reporting

Monitor preprocessing progress in real-time:

```typescript
interface PreprocessingProgress {
  stage: string; // Current processing stage
  operation: PreprocessingOperation; // Current operation
  progress: number; // Progress percentage (0-100)
  message: string; // Human-readable message
  estimatedTimeRemaining?: number; // Estimated time remaining (ms)
}
```

## Error Handling

The pipeline provides comprehensive error handling:

```typescript
const result = await preprocessImage(imageInput, {
  onError: error => {
    console.error('Preprocessing error:', error.message);
    // Handle specific error types
    switch (error.code) {
      case 'INVALID_INPUT':
        // Handle invalid input
        break;
      case 'PROCESSING_FAILED':
        // Handle processing failure
        break;
      case 'CANVAS_ERROR':
        // Handle canvas-related errors
        break;
    }
  },
});

// Check result
if (!result.success) {
  console.error('Preprocessing failed:', result.errors);
}
```

## Browser Compatibility

Check browser compatibility before processing:

```typescript
import { checkCanvasCompatibility } from '@/lib/image-processing';

const compatibility = checkCanvasCompatibility();

if (!compatibility.canvas2D) {
  console.error('Canvas 2D not supported');
  return;
}

console.log('Supported formats:', compatibility.supportedFormats);
console.log('Max canvas size:', compatibility.maxCanvasSize);
```

## Performance Optimization

### Memory Management

```typescript
// Limit image dimensions to reduce memory usage
const result = await preprocessImage(imageInput, {
  maxDimensions: { width: 2048, height: 2048 },
  preserveAspectRatio: true,
});
```

### Processing Time

```typescript
// Fast processing configuration
const fastConfig = {
  grayscale: { enabled: true, method: 'average' },
  contrast: { enabled: true, adaptive: false },
  noiseReduction: { enabled: true, method: 'median', kernelSize: 3 },
  rotationCorrection: { enabled: false },
  sharpening: { enabled: false },
};
```

## Examples

### Basic Document Processing

```typescript
import { preprocessImage } from '@/lib/image-processing';

async function processDocument(file: File) {
  const result = await preprocessImage(file, {
    config: {
      grayscale: { enabled: true },
      contrast: { enabled: true, adaptive: true },
      noiseReduction: { enabled: true, method: 'bilateral' },
      rotationCorrection: { enabled: true },
    },
    onProgress: progress => {
      updateProgressBar(progress.progress);
    },
  });

  if (result.success) {
    return result.processedImage;
  } else {
    throw new Error(`Processing failed: ${result.errors?.join(', ')}`);
  }
}
```

### Batch Processing

```typescript
import { preprocessRomanianID } from '@/lib/image-processing';

async function processBatch(files: File[]) {
  const results = [];

  for (const file of files) {
    try {
      const result = await preprocessRomanianID(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
    }
  }

  return results;
}
```

### Quality Analysis

```typescript
import { analyzeImage, createCanvasContext } from '@/lib/image-processing';

async function analyzeImageQuality(imageInput: ImageInput) {
  const context = await createCanvasContext(imageInput);
  const analysis = analyzeImage(context);

  console.log('Image Analysis:', {
    dimensions: analysis.dimensions,
    isDocumentImage: analysis.isDocumentImage,
    qualityScore: analysis.suitabilityScore,
    recommendedOperations: analysis.recommendedOperations,
  });

  return analysis;
}
```

## Integration with OCR

The preprocessing pipeline integrates seamlessly with the OCR engine:

```typescript
import { ocrEngine } from '@/lib/ocr';

// OCR with preprocessing
const ocrResult = await ocrEngine.processImage(imageInput, {
  language: 'ron',
  preprocessImage: true, // Enable preprocessing
  // Additional OCR options...
});
```

## Troubleshooting

### Common Issues

1. **Canvas not supported**: Check browser compatibility
2. **Memory errors**: Reduce image dimensions or use smaller kernel sizes
3. **Poor quality results**: Adjust configuration parameters
4. **Slow processing**: Use fast processing configuration

### Debug Mode

Enable detailed logging for debugging:

```typescript
const pipeline = new PreprocessingPipeline({
  onProgress: progress => console.log('Progress:', progress),
  onError: error => console.error('Error:', error),
});
```

## API Reference

### Classes

- `PreprocessingPipeline` - Main preprocessing pipeline class

### Functions

- `preprocessImage()` - Process image with default settings
- `preprocessRomanianID()` - Process Romanian ID with optimized settings
- `analyzeImage()` - Analyze image quality and characteristics
- `checkCanvasCompatibility()` - Check browser compatibility

### Types

- `PreprocessingConfig` - Configuration interface
- `PreprocessingResult` - Processing result interface
- `PreprocessingProgress` - Progress reporting interface
- `ImageQualityMetrics` - Quality metrics interface

## Contributing

When contributing to the preprocessing pipeline:

1. Maintain backward compatibility
2. Add comprehensive tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Optimize for performance

## License

This preprocessing pipeline is part of the Romanian ID OCR system and follows the same license
terms.
