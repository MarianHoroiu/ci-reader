/**
 * Romanian ID Image Preprocessor for Enhanced OCR Accuracy
 * Based on best practices from Docparser and Tesseract documentation
 * Adapted from new-image-processing.js for TypeScript and Romanian ID optimization
 */

export interface PreprocessingSettings {
  contrast: number;
  brightness: number;
  gamma: number;
  sharpen: boolean;
  denoise: boolean;
  dpi: number;
  grayscale: boolean;
  threshold: number;
}

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  settings: PreprocessingSettings;
}

// Optimized settings for Romanian ID cards based on OCR best practices
export const ROMANIAN_ID_OPTIMAL_SETTINGS: PreprocessingSettings = {
  contrast: 1.8, // Higher contrast for better text distinction
  brightness: 1.1, // Slight brightness boost
  gamma: 0.7, // Lower gamma for better text clarity
  sharpen: true, // Essential for character edge definition
  denoise: true, // Remove scanning artifacts
  dpi: 300, // Optimal DPI for OCR (as per Docparser recommendations)
  grayscale: true, // Reduces noise and improves OCR accuracy
  threshold: 140, // Optimized for Romanian ID text contrast
};

export class RomanianIDPreprocessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  /**
   * Apply gamma correction to image data
   */
  private applyGammaCorrection(imageData: ImageData, gamma: number): ImageData {
    const data = imageData.data;
    const gammaCorrection = 1 / gamma;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 * Math.pow(data[i] / 255, gammaCorrection); // R
      data[i + 1] = 255 * Math.pow(data[i + 1] / 255, gammaCorrection); // G
      data[i + 2] = 255 * Math.pow(data[i + 2] / 255, gammaCorrection); // B
    }

    return imageData;
  }

  /**
   * Apply convolution filter to image data
   */
  private applyConvolution(
    imageData: ImageData,
    kernel: number[],
    kernelWeight: number = 1
  ): ImageData {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src);
    const width = imageData.width;
    const height = imageData.height;
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const srcY = y + ky - half;
            const srcX = x + kx - half;
            const srcOffset = (srcY * width + srcX) * 4;
            const kernelValue = kernel[ky * kernelSize + kx];

            r += src[srcOffset] * kernelValue;
            g += src[srcOffset + 1] * kernelValue;
            b += src[srcOffset + 2] * kernelValue;
          }
        }

        const dstOffset = (y * width + x) * 4;
        dst[dstOffset] = r / kernelWeight;
        dst[dstOffset + 1] = g / kernelWeight;
        dst[dstOffset + 2] = b / kernelWeight;
      }
    }

    return new ImageData(dst, width, height);
  }

  /**
   * Sharpen image using convolution kernel
   */
  private sharpenImage(imageData: ImageData): ImageData {
    // Optimized sharpening kernel for text documents
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    return this.applyConvolution(imageData, sharpenKernel);
  }

  /**
   * Reduce noise using Gaussian blur
   */
  private denoiseImage(imageData: ImageData): ImageData {
    // Mild Gaussian blur to reduce noise while preserving text clarity
    const gaussianKernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    return this.applyConvolution(imageData, gaussianKernel, 16);
  }

  /**
   * Process image with Romanian ID optimized settings
   */
  async processImage(
    imageFile: File,
    settings: PreprocessingSettings = ROMANIAN_ID_OPTIMAL_SETTINGS
  ): Promise<ProcessedImageResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate dimensions for desired DPI
          const scaleFactor = settings.dpi / 72; // 72 DPI is web standard
          const newWidth = Math.floor(img.width * scaleFactor);
          const newHeight = Math.floor(img.height * scaleFactor);

          this.canvas.width = newWidth;
          this.canvas.height = newHeight;

          // Draw scaled image with high quality
          this.ctx.imageSmoothingEnabled = true;
          this.ctx.imageSmoothingQuality = 'high';
          this.ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Get image data for processing
          let imageData = this.ctx.getImageData(0, 0, newWidth, newHeight);
          const data = imageData.data;

          // 1. Convert to grayscale if enabled
          if (settings.grayscale) {
            for (let i = 0; i < data.length; i += 4) {
              // Use luminance formula for better grayscale conversion
              const gray =
                0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = gray; // R
              data[i + 1] = gray; // G
              data[i + 2] = gray; // B
            }
          }

          // 2. Adjust contrast and brightness
          for (let i = 0; i < data.length; i += 4) {
            // Apply contrast and brightness adjustments
            data[i] = Math.min(
              255,
              Math.max(
                0,
                (data[i] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
            data[i + 1] = Math.min(
              255,
              Math.max(
                0,
                (data[i + 1] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
            data[i + 2] = Math.min(
              255,
              Math.max(
                0,
                (data[i + 2] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
          }

          // 3. Apply gamma correction
          imageData = this.applyGammaCorrection(imageData, settings.gamma);

          // 4. Reduce noise if enabled
          if (settings.denoise) {
            imageData = this.denoiseImage(imageData);
          }

          // 5. Sharpen image if enabled
          if (settings.sharpen) {
            imageData = this.sharpenImage(imageData);
          }

          // 6. Apply binarization (threshold) for grayscale images
          if (settings.grayscale) {
            const finalData = imageData.data;
            for (let i = 0; i < finalData.length; i += 4) {
              const gray = finalData[i];
              const binary = gray > settings.threshold ? 255 : 0;
              finalData[i] = binary;
              finalData[i + 1] = binary;
              finalData[i + 2] = binary;
            }
          }

          // Apply final result to canvas
          this.ctx.putImageData(imageData, 0, 0);

          // Convert to data URL
          const dataUrl = this.canvas.toDataURL('image/png', 1.0);

          resolve({
            dataUrl,
            width: newWidth,
            height: newHeight,
            settings,
          });
        } catch (error) {
          reject(new Error(`Image processing failed: ${error}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load image from file
      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Process image from data URL (for already uploaded images)
   */
  async processImageFromDataUrl(
    dataUrl: string,
    settings: PreprocessingSettings = ROMANIAN_ID_OPTIMAL_SETTINGS
  ): Promise<ProcessedImageResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Same processing logic as above
          const scaleFactor = settings.dpi / 72;
          const newWidth = Math.floor(img.width * scaleFactor);
          const newHeight = Math.floor(img.height * scaleFactor);

          this.canvas.width = newWidth;
          this.canvas.height = newHeight;

          this.ctx.imageSmoothingEnabled = true;
          this.ctx.imageSmoothingQuality = 'high';
          this.ctx.drawImage(img, 0, 0, newWidth, newHeight);

          let imageData = this.ctx.getImageData(0, 0, newWidth, newHeight);
          const data = imageData.data;

          // Apply all processing steps (same as above)
          if (settings.grayscale) {
            for (let i = 0; i < data.length; i += 4) {
              const gray =
                0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
          }

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(
              255,
              Math.max(
                0,
                (data[i] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
            data[i + 1] = Math.min(
              255,
              Math.max(
                0,
                (data[i + 1] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
            data[i + 2] = Math.min(
              255,
              Math.max(
                0,
                (data[i + 2] - 128) * settings.contrast +
                  128 +
                  (settings.brightness - 1) * 50
              )
            );
          }

          imageData = this.applyGammaCorrection(imageData, settings.gamma);

          if (settings.denoise) {
            imageData = this.denoiseImage(imageData);
          }

          if (settings.sharpen) {
            imageData = this.sharpenImage(imageData);
          }

          if (settings.grayscale) {
            const finalData = imageData.data;
            for (let i = 0; i < finalData.length; i += 4) {
              const gray = finalData[i];
              const binary = gray > settings.threshold ? 255 : 0;
              finalData[i] = binary;
              finalData[i + 1] = binary;
              finalData[i + 2] = binary;
            }
          }

          this.ctx.putImageData(imageData, 0, 0);
          const processedDataUrl = this.canvas.toDataURL('image/png', 1.0);

          resolve({
            dataUrl: processedDataUrl,
            width: newWidth,
            height: newHeight,
            settings,
          });
        } catch (error) {
          reject(new Error(`Image processing failed: ${error}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image from data URL'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Get preview of processing without full resolution
   */
  async getPreview(
    dataUrl: string,
    settings: PreprocessingSettings,
    maxWidth: number = 400
  ): Promise<string> {
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const aspectRatio = img.height / img.width;
        const previewWidth = Math.min(maxWidth, img.width);
        const previewHeight = previewWidth * aspectRatio;

        this.canvas.width = previewWidth;
        this.canvas.height = previewHeight;

        this.ctx.drawImage(img, 0, 0, previewWidth, previewHeight);

        // Apply basic processing for preview
        let imageData = this.ctx.getImageData(
          0,
          0,
          previewWidth,
          previewHeight
        );
        const data = imageData.data;

        if (settings.grayscale) {
          for (let i = 0; i < data.length; i += 4) {
            const gray =
              0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
        }

        // Apply contrast and brightness
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(
            255,
            Math.max(
              0,
              (data[i] - 128) * settings.contrast +
                128 +
                (settings.brightness - 1) * 50
            )
          );
          data[i + 1] = Math.min(
            255,
            Math.max(
              0,
              (data[i + 1] - 128) * settings.contrast +
                128 +
                (settings.brightness - 1) * 50
            )
          );
          data[i + 2] = Math.min(
            255,
            Math.max(
              0,
              (data[i + 2] - 128) * settings.contrast +
                128 +
                (settings.brightness - 1) * 50
            )
          );
        }

        this.ctx.putImageData(imageData, 0, 0);
        resolve(this.canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to load preview image'));
      img.src = dataUrl;
    });
  }
}
