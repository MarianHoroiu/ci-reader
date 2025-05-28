/**
 * OCR Web Worker
 * Handles Tesseract.js operations in a separate thread to prevent UI blocking
 */

// Import Tesseract.js from CDN
importScripts(
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'
);

// Worker state
let tesseractWorker = null;
let isInitialized = false;
let isProcessing = false;
let currentLanguage = null;
let workerConfig = null;
let ocrConfig = null;

/**
 * Send message to main thread
 */
function sendMessage(type, payload, messageId = null) {
  const message = {
    id:
      messageId ||
      `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    payload: payload,
    timestamp: Date.now(),
  };

  self.postMessage(message);
}

/**
 * Send error message to main thread
 */
function sendError(error, jobId = null, messageId = null) {
  const errorPayload = {
    code: error.code || 'WORKER_ERROR',
    message: error.message || 'Unknown worker error',
    details: error.stack || error.toString(),
    recoverable: true,
    timestamp: new Date(),
    jobId: jobId,
  };

  sendMessage('ERROR', { error: errorPayload, jobId: jobId }, messageId);
}

/**
 * Send progress update to main thread
 */
function sendProgress(progress, jobId) {
  const progressPayload = {
    status: mapTesseractStatus(progress.status),
    progress: progress.progress * 100,
    message: progress.status,
    stage: progress.status,
    estimatedTimeRemaining:
      progress.progress > 0
        ? ((Date.now() - progress.startTime) / progress.progress) *
          (1 - progress.progress)
        : undefined,
  };

  sendMessage('PROGRESS_UPDATE', { progress: progressPayload, jobId: jobId });
}

/**
 * Map Tesseract status to OCR progress status
 */
function mapTesseractStatus(status) {
  switch (status) {
    case 'loading tesseract core':
    case 'initializing tesseract':
      return 'initializing';
    case 'loading language traineddata':
      return 'loading';
    case 'recognizing text':
      return 'recognizing';
    case 'done':
      return 'completed';
    default:
      return 'recognizing';
  }
}

/**
 * Initialize Tesseract worker
 */
async function initializeWorker(language, config, ocrSettings) {
  try {
    if (tesseractWorker) {
      await tesseractWorker.terminate();
    }

    // Store configuration
    currentLanguage = language;
    workerConfig = config;
    ocrConfig = ocrSettings;

    // Create Tesseract worker with configuration
    const tesseractConfig = {
      langPath: config.langPath,
      gzip: config.gzip,
    };

    if (config.corePath) {
      tesseractConfig.corePath = config.corePath;
    }

    if (config.workerPath) {
      tesseractConfig.workerPath = config.workerPath;
    }

    tesseractWorker = await Tesseract.createWorker(
      language,
      1,
      tesseractConfig
    );

    // Configure OCR parameters
    await tesseractWorker.setParameters({
      tessedit_pageseg_mode: ocrSettings.psm,
      tessedit_ocr_engine_mode: ocrSettings.oem,
      tessedit_char_whitelist: ocrSettings.tesseditCharWhitelist || '',
      tessedit_char_blacklist: ocrSettings.tesseditCharBlacklist || '',
      preserve_interword_spaces: ocrSettings.preserveInterwordSpaces
        ? '1'
        : '0',
    });

    isInitialized = true;

    sendMessage('INITIALIZED', {
      success: true,
      language: language,
    });
  } catch (error) {
    isInitialized = false;
    sendError(error);
    sendMessage('INITIALIZED', {
      success: false,
      language: language,
      error: {
        code: 'INITIALIZATION_FAILED',
        message: error.message,
        details: error.stack,
        recoverable: true,
        timestamp: new Date(),
      },
    });
  }
}

/**
 * Process image with OCR
 */
async function processImage(imageData, options, preprocessingOptions, jobId) {
  if (!isInitialized || !tesseractWorker) {
    sendError(new Error('Worker not initialized'), jobId);
    return;
  }

  if (isProcessing) {
    sendError(new Error('Worker is already processing another image'), jobId);
    return;
  }

  try {
    isProcessing = true;
    const startTime = Date.now();

    // Preprocess image if requested
    let processedImageData = imageData;
    let preprocessingResult = null;

    if (
      preprocessingOptions &&
      (preprocessingOptions.convertToGrayscale ||
        preprocessingOptions.enhanceContrast ||
        preprocessingOptions.removeNoise)
    ) {
      const preprocessResult = await preprocessImage(
        imageData,
        preprocessingOptions
      );
      processedImageData = preprocessResult.processedImage;
      preprocessingResult = preprocessResult;
    }

    // Perform OCR recognition
    const result = await tesseractWorker.recognize(processedImageData, {
      logger: info => {
        sendProgress(
          {
            ...info,
            startTime: startTime,
          },
          jobId
        );
      },
    });

    // Process and correct the extracted text if Romanian
    let correctedText = result.data.text;
    if (currentLanguage === 'ron' || currentLanguage.includes('ron')) {
      correctedText = correctRomanianText(correctedText);
    }

    // Build OCR result
    const ocrResult = {
      text: correctedText,
      confidence: result.data.confidence,
      words: mapWords(result.data.words),
      lines: mapLines(result.data.lines),
      paragraphs: mapParagraphs(result.data.paragraphs),
      blocks: mapBlocks(result.data.blocks),
      bbox: mapBoundingBox(result.data.bbox),
      processingTime: Date.now() - startTime,
      language: currentLanguage,
    };

    // Send result back to main thread
    sendMessage('RESULT', {
      result: ocrResult,
      preprocessingResult: preprocessingResult,
      jobId: jobId,
    });
  } catch (error) {
    sendError(error, jobId);
  } finally {
    isProcessing = false;
  }
}

/**
 * Preprocess image for better OCR accuracy
 */
async function preprocessImage(imageData, options) {
  const startTime = Date.now();
  const operations = [];

  try {
    // Create image from base64 data
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // Create canvas for processing
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Apply preprocessing operations
    if (options.convertToGrayscale) {
      convertToGrayscale(ctx, canvas.width, canvas.height);
      operations.push('grayscale');
    }

    if (options.enhanceContrast) {
      enhanceContrast(ctx, canvas.width, canvas.height);
      operations.push('contrast_enhancement');
    }

    if (options.removeNoise) {
      removeNoise(ctx, canvas.width, canvas.height);
      operations.push('noise_removal');
    }

    // Convert back to base64
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.9,
    });
    const processedImageData = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    return {
      processedImage: processedImageData,
      operations: operations,
      qualityScore: calculateImageQuality(ctx, canvas.width, canvas.height),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return {
      processedImage: imageData,
      operations: ['preprocessing_failed'],
      qualityScore: 0.5,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Convert image to grayscale
 */
function convertToGrayscale(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    );
    data[i] = gray; // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (data[i + 3]) remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Enhance image contrast
 */
function enhanceContrast(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = 1.5; // Contrast enhancement factor

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128)); // Red
    data[i + 1] = Math.min(
      255,
      Math.max(0, factor * (data[i + 1] - 128) + 128)
    ); // Green
    data[i + 2] = Math.min(
      255,
      Math.max(0, factor * (data[i + 2] - 128) + 128)
    ); // Blue
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Remove noise from image
 */
function removeNoise(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  // Simple median filter for noise removal
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        // RGB channels
        const pixels = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
            pixels.push(data[idx]);
          }
        }
        pixels.sort((a, b) => a - b);
        const idx = (y * width + x) * 4 + c;
        newData[idx] = pixels[4]; // Median value
      }
    }
  }

  const newImageData = new ImageData(newData, width, height);
  ctx.putImageData(newImageData, 0, 0);
}

/**
 * Calculate image quality score
 */
function calculateImageQuality(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let totalVariance = 0;
  let pixelCount = 0;

  // Calculate variance as a measure of image quality
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalVariance += gray * gray;
    pixelCount++;
  }

  const variance = totalVariance / pixelCount;
  return Math.min(1.0, variance / 10000); // Normalize to 0-1 range
}

/**
 * Simple Romanian text correction (basic implementation for worker)
 */
function correctRomanianText(text) {
  if (!text || typeof text !== 'string') return text;

  // Basic character corrections for common OCR errors
  const corrections = {
    à: 'ă',
    á: 'ă',
    ã: 'ă',
    À: 'Ă',
    Á: 'Ă',
    Ã: 'Ă',
    ä: 'â',
    Ä: 'Â',
    ì: 'î',
    í: 'î',
    ï: 'î',
    Ì: 'Î',
    Í: 'Î',
    Ï: 'Î',
    š: 'ș',
    ş: 'ș',
    Š: 'Ș',
    Ş: 'Ș',
    ţ: 'ț',
    Ţ: 'Ț',
  };

  let corrected = text;
  for (const [incorrect, correct] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(incorrect, 'g'), correct);
  }

  return corrected;
}

/**
 * Map Tesseract words to OCR words
 */
function mapWords(words) {
  return words.map(word => ({
    text: word.text,
    confidence: word.confidence,
    bbox: mapBoundingBox(word.bbox),
    baseline: word.baseline,
    fontSize: word.font_size || 0,
    fontName: word.font_name || '',
    bold: word.bold || false,
    italic: word.italic || false,
  }));
}

/**
 * Map Tesseract lines to OCR lines
 */
function mapLines(lines) {
  return lines.map(line => ({
    text: line.text,
    confidence: line.confidence,
    bbox: mapBoundingBox(line.bbox),
    baseline: line.baseline,
    words: mapWords(line.words || []),
  }));
}

/**
 * Map Tesseract paragraphs to OCR paragraphs
 */
function mapParagraphs(paragraphs) {
  return paragraphs.map(paragraph => ({
    text: paragraph.text,
    confidence: paragraph.confidence,
    bbox: mapBoundingBox(paragraph.bbox),
    lines: mapLines(paragraph.lines || []),
  }));
}

/**
 * Map Tesseract blocks to OCR blocks
 */
function mapBlocks(blocks) {
  return blocks.map(block => ({
    text: block.text,
    confidence: block.confidence,
    bbox: mapBoundingBox(block.bbox),
    paragraphs: mapParagraphs(block.paragraphs || []),
  }));
}

/**
 * Map Tesseract bounding box to OCR bounding box
 */
function mapBoundingBox(bbox) {
  return {
    x0: bbox.x0 || 0,
    y0: bbox.y0 || 0,
    x1: bbox.x1 || 0,
    y1: bbox.y1 || 0,
  };
}

/**
 * Terminate worker
 */
async function terminateWorker(force = false) {
  try {
    if (tesseractWorker) {
      await tesseractWorker.terminate();
      tesseractWorker = null;
    }

    isInitialized = false;
    isProcessing = false;
    currentLanguage = null;
    workerConfig = null;
    ocrConfig = null;

    sendMessage('TERMINATED', { success: true });
  } catch (error) {
    sendMessage('TERMINATED', {
      success: false,
      error: {
        code: 'TERMINATION_FAILED',
        message: error.message,
        details: error.stack,
        recoverable: false,
        timestamp: new Date(),
      },
    });
  }
}

/**
 * Get worker status
 */
function getStatus() {
  sendMessage('STATUS_RESPONSE', {
    isInitialized: isInitialized,
    isProcessing: isProcessing,
    currentLanguage: currentLanguage,
    memoryUsage:
      self.performance && self.performance.memory
        ? self.performance.memory.usedJSHeapSize
        : 0,
  });
}

/**
 * Message handler
 */
self.addEventListener('message', async event => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'INITIALIZE':
        await initializeWorker(
          payload.language,
          payload.workerConfig,
          payload.ocrConfig
        );
        break;

      case 'PROCESS_IMAGE':
        await processImage(
          payload.imageData,
          payload.options,
          payload.preprocessingOptions,
          id
        );
        break;

      case 'TERMINATE':
        await terminateWorker(payload?.force);
        break;

      case 'GET_STATUS':
        getStatus();
        break;

      default:
        sendError(new Error(`Unknown message type: ${type}`), null, id);
    }
  } catch (error) {
    sendError(error, null, id);
  }
});

/**
 * Error handler
 */
self.addEventListener('error', error => {
  sendError({
    code: 'WORKER_RUNTIME_ERROR',
    message: error.message,
    details: error.filename + ':' + error.lineno + ':' + error.colno,
    recoverable: false,
    timestamp: new Date(),
  });
});

/**
 * Unhandled rejection handler
 */
self.addEventListener('unhandledrejection', event => {
  sendError({
    code: 'WORKER_UNHANDLED_REJECTION',
    message: event.reason?.message || 'Unhandled promise rejection',
    details: event.reason?.stack || event.reason?.toString(),
    recoverable: false,
    timestamp: new Date(),
  });
});

// Send ready message
sendMessage('INITIALIZED', { success: false, language: null });
