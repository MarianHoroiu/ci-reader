/**
 * Simplified OCR Web Worker
 * Based on Tesseract.js documentation and best practices
 * Fixes CSP issues and worker communication problems
 */

/* global importScripts, Tesseract */

// Import Tesseract.js from local files
try {
  importScripts('/workers/tesseract/tesseract.min.js');
} catch (error) {
  console.error('Failed to load Tesseract.js:', error);
  self.postMessage({
    id: 'init_error',
    type: 'ERROR',
    payload: {
      error: {
        code: 'TESSERACT_LOAD_FAILED',
        message: 'Failed to load Tesseract.js library',
        details: error.toString(),
        recoverable: false,
        timestamp: new Date(),
      },
    },
    timestamp: Date.now(),
  });
}

// Worker state
let worker = null;
let isInitialized = false;
let isProcessing = false;
let currentLanguage = null;
let workerId = null;

/**
 * Send message to main thread
 */
function sendMessage(type, payload, messageId = null) {
  const message = {
    id:
      messageId ||
      workerId ||
      `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    payload: payload,
    timestamp: Date.now(),
  };

  self.postMessage(message);
}

/**
 * Send error message
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
 * Send progress update
 */
function sendProgress(progress, jobId) {
  const progressPayload = {
    status: progress.status || 'recognizing',
    progress: (progress.progress || 0) * 100,
    message: progress.status || 'Processing...',
    stage: progress.status || 'recognizing',
  };

  sendMessage('PROGRESS_UPDATE', { progress: progressPayload, jobId: jobId });
}

/**
 * Initialize worker using createWorker API
 */
async function initializeWorker(language, _config, _ocrSettings) {
  try {
    if (worker) {
      await worker.terminate();
    }

    currentLanguage = language;

    // Create worker using the simplified API from documentation
    worker = await Tesseract.createWorker(language, 1, {
      langPath: '/workers/tesseract/',
      gzip: false,
      workerPath: '/workers/tesseract/worker.min.js',
      corePath: '/workers/tesseract/tesseract-core.wasm.js',
      logger: m => {
        // Handle progress updates during initialization
        if (m.status && m.progress !== undefined) {
          sendProgress(m, 'init');
        }
      },
    });

    isInitialized = true;

    sendMessage('INITIALIZED', {
      success: true,
      language: language,
    });
  } catch (error) {
    isInitialized = false;
    console.error('Worker initialization failed:', error);
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
  if (!isInitialized || !worker) {
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

    // Use the recognize method with progress logging
    const result = await worker.recognize(imageData, {
      logger: m => {
        if (m.status && m.progress !== undefined) {
          sendProgress(m, jobId);
        }
      },
    });

    // Build OCR result
    const ocrResult = {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words || [],
      lines: result.data.lines || [],
      paragraphs: result.data.paragraphs || [],
      blocks: result.data.blocks || [],
      bbox: result.data.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
      processingTime: Date.now() - startTime,
      language: currentLanguage,
    };

    // Send result back to main thread
    sendMessage('RESULT', {
      result: ocrResult,
      jobId: jobId,
    });
  } catch (error) {
    console.error('OCR processing failed:', error);
    sendError(error, jobId);
  } finally {
    isProcessing = false;
  }
}

/**
 * Terminate worker
 */
async function terminateWorker() {
  try {
    if (worker) {
      await worker.terminate();
      worker = null;
    }

    isInitialized = false;
    isProcessing = false;
    currentLanguage = null;

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
    workerId: workerId,
  });
}

/**
 * Message handler
 */
self.addEventListener('message', async event => {
  const { id, type, payload } = event.data;

  try {
    // Store worker ID if provided
    if (id && !workerId) {
      workerId = id;
    }

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
        await terminateWorker();
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
sendMessage('WORKER_READY', {
  success: true,
  workerId: workerId,
  timestamp: Date.now(),
});
