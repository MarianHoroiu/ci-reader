/**
 * Progress Tracking Types for AI Processing
 * Optimized for Qwen2.5-VL-7B-Instruct processing operations
 */

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'preprocessing'
  | 'ai-analysis'
  | 'data-extraction'
  | 'validation'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface ProcessingStageInfo {
  /** Stage identifier */
  stage: ProcessingStage;
  /** Human-readable stage name */
  name: string;
  /** Stage description */
  description: string;
  /** Expected duration in milliseconds */
  expectedDuration: number;
  /** Stage weight for overall progress (0-1) */
  weight: number;
  /** Whether this stage can be cancelled */
  cancellable: boolean;
}

export interface ProcessingProgress {
  /** Current processing stage */
  currentStage: ProcessingStage;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Current stage progress percentage (0-100) */
  stageProgress: number;
  /** Processing start timestamp */
  startTime: number;
  /** Current timestamp */
  currentTime: number;
  /** Estimated completion time */
  estimatedCompletion: number;
  /** Elapsed time in milliseconds */
  elapsedTime: number;
  /** Remaining time in milliseconds */
  remainingTime: number;
  /** Processing speed (stages per second) */
  processingSpeed: number;
  /** Whether processing can be cancelled */
  cancellable: boolean;
  /** Processing session ID */
  sessionId: string;
}

export interface TimeEstimation {
  /** Base processing time in milliseconds */
  baseTime: number;
  /** Image size factor multiplier */
  sizeFactor: number;
  /** Image complexity factor multiplier */
  complexityFactor: number;
  /** System performance factor multiplier */
  performanceFactor: number;
  /** Final estimated time in milliseconds */
  estimatedTime: number;
  /** Confidence level (0-1) */
  confidence: number;
}

export interface ProcessingError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error details */
  details?: any;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Suggested recovery action */
  recoveryAction?: string;
  /** Error timestamp */
  timestamp: number;
  /** Processing stage where error occurred */
  stage: ProcessingStage;
}

export interface ProcessingMetrics {
  /** Total processing time */
  totalTime: number;
  /** Time spent in each stage */
  stageTimings: Record<ProcessingStage, number>;
  /** Memory usage peak in MB */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Processing efficiency score (0-1) */
  efficiency: number;
  /** Throughput (operations per second) */
  throughput: number;
  /** Error count */
  errorCount: number;
  /** Retry count */
  retryCount: number;
}

export interface ProcessingSession {
  /** Unique session identifier */
  id: string;
  /** Session start time */
  startTime: number;
  /** Session end time */
  endTime?: number;
  /** Current progress state */
  progress: ProcessingProgress;
  /** Time estimation data */
  timeEstimation: TimeEstimation;
  /** Processing errors */
  errors: ProcessingError[];
  /** Performance metrics */
  metrics: ProcessingMetrics;
  /** Session status */
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  /** Image metadata */
  imageMetadata?: {
    size: number;
    width: number;
    height: number;
    format: string;
    complexity: number;
  };
}

export interface ProgressUpdateCallback {
  (_progress: ProcessingProgress): void;
}

export interface StageChangeCallback {
  (_stage: ProcessingStage, _progress: number): void;
}

export interface ErrorCallback {
  (_error: ProcessingError): void;
}

export interface CompletionCallback {
  (_session: ProcessingSession): void;
}

export interface ProgressTrackerOptions {
  /** Progress update interval in milliseconds */
  updateInterval?: number;
  /** Enable performance metrics collection */
  collectMetrics?: boolean;
  /** Enable progress persistence */
  persistProgress?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Timeout for processing in milliseconds */
  timeout?: number;
  /** Callback functions */
  callbacks?: {
    onProgress?: ProgressUpdateCallback;
    onStageChange?: StageChangeCallback;
    onError?: ErrorCallback;
    onComplete?: CompletionCallback;
  };
}

export interface QwenProcessingConfig {
  /** Expected processing time for Qwen2.5-VL */
  expectedProcessingTime: number;
  /** Processing stages configuration */
  stages: ProcessingStageInfo[];
  /** Time estimation parameters */
  timeEstimation: {
    baseTime: number;
    sizeFactors: Record<string, number>;
    complexityFactors: Record<string, number>;
  };
  /** Performance thresholds */
  performanceThresholds: {
    maxProcessingTime: number;
    maxMemoryUsage: number;
    minEfficiency: number;
  };
}

export interface ProgressPersistence {
  /** Save progress to storage */
  save: (_sessionId: string, _session: ProcessingSession) => Promise<void>;
  /** Load progress from storage */
  load: (_sessionId: string) => Promise<ProcessingSession | null>;
  /** Clear progress from storage */
  clear: (_sessionId: string) => Promise<void>;
  /** List all saved sessions */
  list: () => Promise<string[]>;
}

export interface CancellationToken {
  /** Whether cancellation is requested */
  isCancelled: boolean;
  /** Cancel the operation */
  cancel: () => void;
  /** Register cancellation callback */
  onCancelled: (_callback: () => void) => void;
}

export type ProgressEventType =
  | 'progress-update'
  | 'stage-change'
  | 'error'
  | 'completion'
  | 'cancellation';

export interface ProgressEvent {
  /** Event type */
  type: ProgressEventType;
  /** Event timestamp */
  timestamp: number;
  /** Session ID */
  sessionId: string;
  /** Event data */
  data: any;
}
