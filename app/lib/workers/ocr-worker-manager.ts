/**
 * OCR Worker Manager
 * Manages Web Worker lifecycle, job queuing, and communication
 */

import type {
  WorkerState,
  WorkerPoolConfig,
  WorkerJob,
  WorkerManagerEvents,
  WorkerMetrics,
  WorkerToMainMessage,
  InitializeWorkerMessage,
  ProcessImageMessage,
  TerminateWorkerMessage,
  InitializedMessage,
  ResultMessage,
  ErrorMessage,
  ProgressUpdateMessage,
} from './worker-types';

import type {
  OCRResult,
  OCRProgress,
  OCRProcessingOptions,
  PreprocessingResult,
} from '../ocr/ocr-types';

import {
  checkWorkerCompatibility,
  generateMessageId,
  createWorkerMessage,
  safePostMessage,
  waitForWorkerMessage,
  withTimeout,
  prepareImageForWorker,
} from './worker-utils';

import {
  classifyWorkerError,
  logWorkerError,
  generateRecoveryPlan,
  incrementRetryCount,
  createTimeoutError,
  createInitializationError,
  createCommunicationError,
  createCompatibilityError,
  type WorkerError,
} from './worker-error-handler';

import { tesseractConfig } from '../ocr/tesseract-config';

// Default worker pool configuration
const DEFAULT_WORKER_CONFIG: WorkerPoolConfig = {
  maxWorkers: 2,
  idleTimeout: 300000, // 5 minutes
  initializationTimeout: 30000, // 30 seconds
  processingTimeout: 120000, // 2 minutes
  enableLogging: true,
};

/**
 * OCR Worker Manager class
 */
export class OCRWorkerManager {
  private static instance: OCRWorkerManager;
  private workers: Map<string, WorkerState> = new Map();
  private jobQueue: WorkerJob[] = [];
  private activeJobs: Map<string, WorkerJob> = new Map();
  private config: WorkerPoolConfig;
  private eventListeners: Partial<WorkerManagerEvents> = {};
  private metrics: WorkerMetrics = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    memoryUsage: 0,
    activeWorkers: 0,
    idleWorkers: 0,
  };
  private isInitialized = false;
  private compatibility = checkWorkerCompatibility();

  private constructor(config: Partial<WorkerPoolConfig> = {}) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...config };

    if (!this.compatibility.isSupported) {
      console.warn('Web Workers not supported, falling back to main thread');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<WorkerPoolConfig>): OCRWorkerManager {
    if (!OCRWorkerManager.instance) {
      OCRWorkerManager.instance = new OCRWorkerManager(config);
    }
    return OCRWorkerManager.instance;
  }

  /**
   * Initialize the worker manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.compatibility.isSupported) {
      throw createCompatibilityError('Web Workers');
    }

    this.isInitialized = true;
    this.log('OCR Worker Manager initialized');
  }

  /**
   * Create a new worker
   */
  private async createWorker(language: string): Promise<WorkerState> {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create worker from public directory (using absolute URL worker)
      const worker = new Worker('/workers/ocr-worker-absolute.js');

      const workerState: WorkerState = {
        id: workerId,
        isInitialized: false,
        isProcessing: false,
        currentLanguage: language,
        createdAt: new Date(),
        lastUsed: new Date(),
        processingJobs: new Set(),
        worker,
      };

      // Set up worker event listeners
      this.setupWorkerEventListeners(workerState);

      // Worker ID will be set via message ID in initialization

      // Initialize worker with configuration
      const initMessage = createWorkerMessage<InitializeWorkerMessage>(
        'INITIALIZE',
        {
          language,
          workerConfig: tesseractConfig.getWorkerConfig(),
          ocrConfig: tesseractConfig.getOCRConfig(),
        }
      );
      initMessage.id = workerId;

      if (!safePostMessage(worker, initMessage)) {
        throw createCommunicationError(
          'Failed to send initialization message',
          undefined,
          workerId
        );
      }

      // Wait for initialization to complete
      const initResult = await withTimeout(
        waitForWorkerMessage<InitializedMessage>(worker, 'INITIALIZED'),
        this.config.initializationTimeout
      );

      if (!initResult.payload.success) {
        throw createInitializationError(
          initResult.payload.error?.message || 'Worker initialization failed',
          initResult.payload.error?.details,
          workerId
        );
      }

      workerState.isInitialized = true;
      this.workers.set(workerId, workerState);
      this.updateMetrics();

      this.log(
        `Created and initialized worker ${workerId} for language: ${language}`
      );
      this.eventListeners.workerCreated?.(workerId);

      return workerState;
    } catch (error) {
      const workerError = classifyWorkerError(error as Error);
      workerError.workerId = workerId;
      logWorkerError(workerError);
      this.eventListeners.workerError?.(workerId, workerError);
      throw workerError;
    }
  }

  /**
   * Set up event listeners for a worker
   */
  private setupWorkerEventListeners(workerState: WorkerState): void {
    const { worker, id: workerId } = workerState;

    worker.addEventListener(
      'message',
      (event: MessageEvent<WorkerToMainMessage>) => {
        this.handleWorkerMessage(workerId, event.data);
      }
    );

    worker.addEventListener('error', (error: ErrorEvent) => {
      const workerError = createCommunicationError(
        `Worker runtime error: ${error.message}`,
        `${error.filename}:${error.lineno}:${error.colno}`,
        workerId
      );
      logWorkerError(workerError);
      this.eventListeners.workerError?.(workerId, workerError);
    });

    worker.addEventListener('messageerror', (error: MessageEvent) => {
      const workerError = createCommunicationError(
        'Worker message error',
        error.data?.toString(),
        workerId
      );
      logWorkerError(workerError);
      this.eventListeners.workerError?.(workerId, workerError);
    });
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(
    workerId: string,
    message: WorkerToMainMessage
  ): void {
    const workerState = this.workers.get(workerId);
    if (!workerState) {
      this.log(`Received message from unknown worker: ${workerId}`);
      return;
    }

    switch (message.type) {
      case 'PROGRESS_UPDATE':
        this.handleProgressUpdate(workerId, message);
        break;

      case 'RESULT':
        this.handleResult(workerId, message);
        break;

      case 'ERROR':
        this.handleError(workerId, message);
        break;

      case 'STATUS_RESPONSE':
        // Handle status response if needed
        break;

      case 'TERMINATED':
        this.handleWorkerTerminated(workerId, message);
        break;

      default:
        this.log(
          `Unknown message type from worker ${workerId}: ${message.type}`
        );
    }
  }

  /**
   * Handle progress update from worker
   */
  private handleProgressUpdate(
    workerId: string,
    message: ProgressUpdateMessage
  ): void {
    const job = this.activeJobs.get(message.payload.jobId);
    if (job) {
      job.onProgress?.(message.payload.progress);
    }
  }

  /**
   * Handle result from worker
   */
  private handleResult(workerId: string, message: ResultMessage): void {
    const job = this.activeJobs.get(message.payload.jobId);
    if (!job) {
      this.log(`Received result for unknown job: ${message.payload.jobId}`);
      return;
    }

    const workerState = this.workers.get(workerId);
    if (workerState) {
      workerState.isProcessing = false;
      workerState.lastUsed = new Date();
      workerState.processingJobs.delete(message.payload.jobId);
    }

    // Update metrics
    this.metrics.completedJobs++;
    this.metrics.totalProcessingTime += message.payload.result.processingTime;
    this.metrics.averageProcessingTime =
      this.metrics.totalProcessingTime / this.metrics.completedJobs;
    this.updateMetrics();

    // Call job callback
    job.onResult?.(message.payload.result, message.payload.preprocessingResult);

    // Remove job from active jobs
    this.activeJobs.delete(message.payload.jobId);

    this.eventListeners.jobCompleted?.(message.payload.jobId, workerId);
    this.log(`Job ${message.payload.jobId} completed by worker ${workerId}`);

    // Process next job in queue
    this.processNextJob();
  }

  /**
   * Handle error from worker
   */
  private handleError(workerId: string, message: ErrorMessage): void {
    const workerError = message.payload.error as WorkerError;
    workerError.workerId = workerId;

    const jobId = message.payload.jobId;
    if (jobId) {
      const job = this.activeJobs.get(jobId);
      if (job) {
        const workerState = this.workers.get(workerId);
        if (workerState) {
          workerState.isProcessing = false;
          workerState.processingJobs.delete(jobId);
        }

        // Update metrics
        this.metrics.failedJobs++;
        this.updateMetrics();

        // Generate recovery plan
        const recoveryPlan = generateRecoveryPlan(workerError);

        if (recoveryPlan.shouldRetry) {
          // Retry the job
          const updatedError = incrementRetryCount(workerError);
          setTimeout(() => {
            this.retryJob(job, updatedError);
          }, recoveryPlan.delayMs);
        } else {
          // Job failed permanently
          job.onError?.(workerError);
          this.activeJobs.delete(jobId);
          this.eventListeners.jobFailed?.(jobId, workerId, workerError);
        }
      }
    }

    logWorkerError(workerError);
    this.eventListeners.workerError?.(workerId, workerError);
  }

  /**
   * Handle worker termination
   */
  private handleWorkerTerminated(workerId: string, _message: any): void {
    this.workers.delete(workerId);
    this.updateMetrics();
    this.eventListeners.workerTerminated?.(workerId);
    this.log(`Worker ${workerId} terminated`);
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: WorkerJob, error: WorkerError): Promise<void> {
    this.log(`Retrying job ${job.id} (attempt ${(error.retryCount || 0) + 1})`);

    // Apply recovery modifications if needed
    const recoveryPlan = generateRecoveryPlan(error);
    if (recoveryPlan.modifications?.restartWorker) {
      // Find and restart the worker
      const workerId = error.workerId;
      if (workerId) {
        await this.restartWorker(workerId);
      }
    }

    // Re-queue the job
    this.jobQueue.unshift(job);
    this.processNextJob();
  }

  /**
   * Restart a worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    const workerState = this.workers.get(workerId);
    if (!workerState) return;

    try {
      // Terminate existing worker
      await this.terminateWorker(workerId, true);

      // Create new worker with same language
      await this.createWorker(workerState.currentLanguage);
    } catch (error) {
      this.log(`Failed to restart worker ${workerId}: ${error}`);
    }
  }

  /**
   * Get or create a worker for the specified language
   */
  private async getAvailableWorker(
    language: string
  ): Promise<WorkerState | null> {
    // Find existing idle worker for this language
    for (const worker of this.workers.values()) {
      if (
        worker.currentLanguage === language &&
        worker.isInitialized &&
        !worker.isProcessing
      ) {
        worker.lastUsed = new Date();
        return worker;
      }
    }

    // Create new worker if under limit
    if (this.workers.size < this.config.maxWorkers) {
      try {
        return await this.createWorker(language);
      } catch (error) {
        this.log(`Failed to create worker: ${error}`);
        return null;
      }
    }

    return null;
  }

  /**
   * Process image with OCR using worker
   */
  async processImage(
    imageInput: string | File | ImageData | HTMLCanvasElement,
    options: OCRProcessingOptions = { language: 'ron' },
    onProgress?: (_progress: OCRProgress) => void,
    onResult?: (
      _result: OCRResult,
      _preprocessing?: PreprocessingResult
    ) => void,
    onError?: (_error: WorkerError) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.compatibility.isSupported) {
      throw createCompatibilityError('Web Workers');
    }

    // Prepare image data for worker
    const imageData = await prepareImageForWorker(imageInput);

    // Create job
    const job: WorkerJob = {
      id: generateMessageId(),
      type: 'PROCESS_IMAGE',
      payload: {
        imageData,
        options,
        preprocessingOptions: {
          ...(options.convertToGrayscale !== undefined && {
            convertToGrayscale: options.convertToGrayscale,
          }),
          ...(options.enhanceContrast !== undefined && {
            enhanceContrast: options.enhanceContrast,
          }),
          ...(options.removeNoise !== undefined && {
            removeNoise: options.removeNoise,
          }),
        },
      },
      createdAt: new Date(),
      timeout: this.config.processingTimeout,
      onProgress,
      onResult,
      onError,
    };

    // Update metrics
    this.metrics.totalJobs++;
    this.updateMetrics();

    // Add to queue
    this.jobQueue.push(job);
    this.processNextJob();

    return job.id;
  }

  /**
   * Process next job in queue
   */
  private async processNextJob(): Promise<void> {
    if (this.jobQueue.length === 0) {
      return;
    }

    const job = this.jobQueue.shift();
    if (!job) return;

    try {
      const worker = await this.getAvailableWorker(
        job.payload.options.language
      );
      if (!worker) {
        // No available worker, put job back in queue
        this.jobQueue.unshift(job);
        return;
      }

      // Mark worker as processing
      worker.isProcessing = true;
      worker.processingJobs.add(job.id);

      // Add to active jobs
      this.activeJobs.set(job.id, job);

      // Send job to worker
      const processMessage = createWorkerMessage<ProcessImageMessage>(
        'PROCESS_IMAGE',
        job.payload
      );
      processMessage.id = job.id; // Use job ID as message ID

      if (!safePostMessage(worker.worker, processMessage)) {
        throw createCommunicationError(
          'Failed to send process message',
          undefined,
          worker.id,
          job.id
        );
      }

      this.eventListeners.jobStarted?.(job.id, worker.id);
      this.log(`Started job ${job.id} on worker ${worker.id}`);

      // Set up timeout
      if (job.timeout) {
        setTimeout(() => {
          if (this.activeJobs.has(job.id)) {
            const timeoutError = createTimeoutError(
              'Image processing',
              job.timeout!,
              worker.id,
              job.id
            );
            this.handleError(worker.id, {
              id: generateMessageId(),
              type: 'ERROR',
              timestamp: Date.now(),
              payload: { error: timeoutError, jobId: job.id },
            });
          }
        }, job.timeout);
      }
    } catch (error) {
      const workerError = classifyWorkerError(error as Error);
      workerError.jobId = job.id;
      job.onError?.(workerError);
      this.metrics.failedJobs++;
      this.updateMetrics();
      logWorkerError(workerError);
    }
  }

  /**
   * Terminate a specific worker
   */
  async terminateWorker(workerId: string, force = false): Promise<boolean> {
    const workerState = this.workers.get(workerId);
    if (!workerState) {
      return false;
    }

    try {
      // Send termination message
      const terminateMessage = createWorkerMessage<TerminateWorkerMessage>(
        'TERMINATE',
        { force }
      );
      safePostMessage(workerState.worker, terminateMessage);

      // Wait for termination or force it
      if (!force) {
        await withTimeout(
          waitForWorkerMessage(workerState.worker, 'TERMINATED'),
          5000
        );
      }

      // Terminate worker
      workerState.worker.terminate();
      this.workers.delete(workerId);
      this.updateMetrics();

      this.log(`Terminated worker ${workerId}`);
      return true;
    } catch (error) {
      this.log(`Failed to terminate worker ${workerId}: ${error}`);
      // Force termination
      workerState.worker.terminate();
      this.workers.delete(workerId);
      this.updateMetrics();
      return false;
    }
  }

  /**
   * Terminate all workers
   */
  async terminateAllWorkers(): Promise<void> {
    const terminationPromises = Array.from(this.workers.keys()).map(workerId =>
      this.terminateWorker(workerId, true)
    );

    await Promise.all(terminationPromises);
    this.workers.clear();
    this.activeJobs.clear();
    this.jobQueue.length = 0;
    this.updateMetrics();

    this.log('All workers terminated');
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.activeWorkers = Array.from(this.workers.values()).filter(
      w => w.isProcessing
    ).length;
    this.metrics.idleWorkers = this.workers.size - this.metrics.activeWorkers;

    // Estimate memory usage (rough calculation)
    this.metrics.memoryUsage = this.workers.size * 50 * 1024 * 1024; // ~50MB per worker
  }

  /**
   * Get current metrics
   */
  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get worker compatibility info
   */
  getCompatibility() {
    return this.compatibility;
  }

  /**
   * Add event listener
   */
  addEventListener<K extends keyof WorkerManagerEvents>(
    event: K,
    listener: WorkerManagerEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Remove event listener
   */
  removeEventListener<K extends keyof WorkerManagerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    await this.terminateAllWorkers();
    this.eventListeners = {};
    this.isInitialized = false;
    this.log('OCR Worker Manager cleaned up');
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[OCRWorkerManager] ${message}`);
    }
  }
}

// Export singleton instance
export const ocrWorkerManager = OCRWorkerManager.getInstance();
