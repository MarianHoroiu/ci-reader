/**
 * LLaVA Progress Tracker
 * Specialized progress tracking for LLaVA processing operations
 */

import {
  ProcessingSession,
  ProcessingStage,
  ProgressTrackerOptions,
  ProcessingProgress,
  ProcessingError,
  ProcessingMetrics,
} from '@/lib/types/progress-types';

import {
  calculateTimeEstimation,
  updateTimeEstimation,
  isProcessingDelayed,
} from '@/lib/utils/time-estimator';

/**
 * Validate stage transition
 */
function isValidStageTransition(
  currentStage: ProcessingStage,
  newStage: ProcessingStage
): boolean {
  // Allow staying in the same state
  if (currentStage === newStage) {
    return true;
  }

  const validTransitions: Record<ProcessingStage, ProcessingStage[]> = {
    idle: ['uploading', 'preprocessing', 'cancelled'],
    uploading: ['preprocessing', 'error', 'cancelled'],
    preprocessing: ['ai-analysis', 'error', 'cancelled'],
    'ai-analysis': ['data-extraction', 'error', 'cancelled'],
    'data-extraction': ['validation', 'error', 'cancelled'],
    validation: ['completed', 'error', 'cancelled'],
    completed: [],
    error: ['preprocessing', 'cancelled'], // Allow retry
    cancelled: [],
  };

  return validTransitions[currentStage]?.includes(newStage) ?? false;
}

/**
 * Calculate overall progress based on stage and stage progress
 */
function calculateOverallProgress(
  stage: ProcessingStage,
  stageProgress: number
): number {
  const stageWeights: Record<ProcessingStage, number> = {
    idle: 0,
    uploading: 10,
    preprocessing: 25,
    'ai-analysis': 60,
    'data-extraction': 85,
    validation: 95,
    completed: 100,
    error: 0,
    cancelled: 0,
  };

  const baseProgress = stageWeights[stage] || 0;
  const nextStageWeight =
    Object.values(stageWeights).find(w => w > baseProgress) || 100;
  const stageRange = nextStageWeight - baseProgress;

  return baseProgress + (stageRange * stageProgress) / 100;
}

/**
 * Calculate remaining time based on current progress
 */
function calculateRemainingTime(
  timeEstimation: any,
  elapsedTime: number,
  overallProgress: number
): number {
  if (overallProgress <= 0) return timeEstimation.estimatedTime;
  if (overallProgress >= 100) return 0;

  const progressRatio = overallProgress / 100;
  const estimatedTotalTime = elapsedTime / progressRatio;
  return Math.max(0, estimatedTotalTime - elapsedTime);
}

/**
 * Check if stage is cancellable
 */
function isStageCancellable(stage: ProcessingStage): boolean {
  const cancellableStages: ProcessingStage[] = [
    'idle',
    'uploading',
    'preprocessing',
    'ai-analysis',
  ];
  return cancellableStages.includes(stage);
}

/**
 * Calculate processing speed
 */
function calculateProcessingSpeed(
  completedStages: ProcessingStage[],
  elapsedTime: number
): number {
  if (elapsedTime <= 0) return 0;
  return (completedStages.length / elapsedTime) * 1000; // stages per second
}

/**
 * Calculate efficiency score
 */
function calculateEfficiency(
  actualTime: number,
  estimatedTime: number
): number {
  if (estimatedTime <= 0) return 1;
  return Math.min(1, estimatedTime / actualTime);
}

/**
 * Progress tracker for LLaVA processing operations
 */
export class LLaVAProgressTracker {
  private sessions = new Map<string, ProcessingSession>();
  private updateIntervals = new Map<string, number>();
  private options: Required<ProgressTrackerOptions>;

  constructor(options: ProgressTrackerOptions = {}) {
    this.options = {
      updateInterval: options.updateInterval ?? 100, // 100ms updates
      collectMetrics: options.collectMetrics ?? true,
      persistProgress: options.persistProgress ?? true,
      maxRetries: options.maxRetries ?? 3,
      timeout: options.timeout ?? 30000, // 30 seconds
      callbacks: options.callbacks ?? {},
    };
  }

  /**
   * Start a new processing session
   */
  public startSession(
    sessionId: string,
    imageMetadata: {
      size: number;
      width: number;
      height: number;
      format: string;
      complexity?: number;
    }
  ): ProcessingSession {
    // Cancel existing session if any
    if (this.sessions.has(sessionId)) {
      this.cancelSession(sessionId);
    }

    const now = Date.now();
    const timeEstimation = calculateTimeEstimation(imageMetadata);

    const initialProgress: ProcessingProgress = {
      currentStage: 'idle',
      overallProgress: 0,
      stageProgress: 0,
      startTime: now,
      currentTime: now,
      estimatedCompletion: now + timeEstimation.estimatedTime,
      elapsedTime: 0,
      remainingTime: timeEstimation.estimatedTime,
      processingSpeed: 0,
      cancellable: true,
      sessionId,
    };

    const initialMetrics: ProcessingMetrics = {
      totalTime: 0,
      stageTimings: {} as Record<ProcessingStage, number>,
      memoryUsage: 0,
      cpuUsage: 0,
      efficiency: 0,
      throughput: 0,
      errorCount: 0,
      retryCount: 0,
    };

    const session: ProcessingSession = {
      id: sessionId,
      startTime: now,
      progress: initialProgress,
      timeEstimation,
      errors: [],
      metrics: initialMetrics,
      status: 'active',
      imageMetadata: {
        ...imageMetadata,
        complexity: imageMetadata.complexity ?? 1,
      },
    };

    this.sessions.set(sessionId, session);

    // Start progress updates
    this.startProgressUpdates(sessionId);

    // Set timeout
    setTimeout(() => {
      if (
        this.sessions.has(sessionId) &&
        this.sessions.get(sessionId)?.status === 'active'
      ) {
        this.handleError(sessionId, {
          code: 'TIMEOUT',
          message: 'Processing timeout exceeded',
          recoverable: false,
          timestamp: Date.now(),
        });
      }
    }, this.options.timeout);

    return session;
  }

  /**
   * Update processing stage
   */
  public updateStage(
    sessionId: string,
    newStage: ProcessingStage,
    stageProgress: number = 0
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return;
    }

    const currentStage = session.progress.currentStage;

    // Special case for error stage to prevent recursion
    if (newStage === 'error') {
      // Directly set to error state without validation
      this._applyStageChange(sessionId, session, newStage, stageProgress);
      return;
    }

    // Validate stage transition
    if (!isValidStageTransition(currentStage, newStage)) {
      // Don't call handleError as it can lead to circular dependency
      // Instead, log the error and mark the session as failed
      console.error(
        `Invalid stage transition from ${currentStage} to ${newStage}`
      );

      const processingError: ProcessingError = {
        code: 'INVALID_STAGE_TRANSITION',
        message: `Invalid stage transition from ${currentStage} to ${newStage}`,
        recoverable: false,
        timestamp: Date.now(),
        stage: currentStage,
      };

      session.errors.push(processingError);
      session.metrics.errorCount++;

      // Directly set to error state
      this._applyStageChange(sessionId, session, 'error', 0);

      // Trigger error callback
      this.options.callbacks.onError?.(processingError);

      return;
    }

    // Apply the stage change
    this._applyStageChange(sessionId, session, newStage, stageProgress);
  }

  /**
   * Private helper method to apply stage changes
   * Extracted to avoid code duplication and enable direct error state transitions
   */
  private _applyStageChange(
    sessionId: string,
    session: ProcessingSession,
    newStage: ProcessingStage,
    stageProgress: number
  ): void {
    const currentStage = session.progress.currentStage;
    const now = Date.now();
    const elapsedTime = now - session.startTime;

    // Record stage timing
    if (this.options.collectMetrics && currentStage !== newStage) {
      const stageStartTime = session.progress.currentTime;
      const stageDuration = now - stageStartTime;
      session.metrics.stageTimings[currentStage] = stageDuration;
    }

    // Update progress
    const overallProgress = calculateOverallProgress(newStage, stageProgress);
    const updatedTimeEstimation = updateTimeEstimation(
      session.timeEstimation,
      elapsedTime,
      newStage,
      stageProgress
    );

    const remainingTime = calculateRemainingTime(
      updatedTimeEstimation,
      elapsedTime,
      overallProgress
    );

    session.progress = {
      ...session.progress,
      currentStage: newStage,
      stageProgress,
      overallProgress,
      currentTime: now,
      elapsedTime,
      remainingTime,
      estimatedCompletion: now + remainingTime,
      cancellable: isStageCancellable(newStage),
      processingSpeed: calculateProcessingSpeed(
        Object.keys(session.metrics.stageTimings) as ProcessingStage[],
        elapsedTime
      ),
    };

    session.timeEstimation = updatedTimeEstimation;

    // Handle completion
    if (newStage === 'completed') {
      this.completeSession(sessionId);
    } else if (newStage === 'error' || newStage === 'cancelled') {
      session.status = newStage === 'error' ? 'failed' : 'cancelled';
      session.endTime = now;
      this.stopProgressUpdates(sessionId);
    }

    // Trigger callbacks
    this.options.callbacks.onStageChange?.(newStage, stageProgress);
    this.options.callbacks.onProgress?.(session.progress);

    // Persist if enabled
    if (this.options.persistProgress) {
      this.persistSession(sessionId);
    }
  }

  /**
   * Update stage progress
   */
  public updateStageProgress(sessionId: string, progress: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return;
    }

    // Skip update if progress is essentially the same (within 1%)
    const currentProgress = session.progress.stageProgress;
    const clampedProgress = Math.max(0, Math.min(100, progress));

    if (Math.abs(currentProgress - clampedProgress) < 1) {
      return; // Skip trivial updates
    }

    this.updateStage(sessionId, session.progress.currentStage, clampedProgress);
  }

  /**
   * Handle processing error
   */
  public handleError(
    sessionId: string,
    error: Omit<ProcessingError, 'stage'>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const processingError: ProcessingError = {
      ...error,
      stage: session.progress.currentStage,
    };

    session.errors.push(processingError);
    session.metrics.errorCount++;

    // Trigger error callback
    this.options.callbacks.onError?.(processingError);

    // Handle recoverable errors with retry
    if (
      error.recoverable &&
      session.metrics.retryCount < this.options.maxRetries
    ) {
      session.metrics.retryCount++;
      // Could implement retry logic here
      return;
    }

    // Non-recoverable error or max retries exceeded - use direct stage transition
    // to avoid potential circular dependency
    if (session.progress.currentStage !== 'error') {
      this._applyStageChange(sessionId, session, 'error', 0);
    }
  }

  /**
   * Cancel processing session
   */
  public cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return;
    }

    // Check if current stage is cancellable
    if (!session.progress.cancellable) {
      // Log error but don't call handleError to avoid potential circular dependency
      console.error(
        `Cannot cancel during ${session.progress.currentStage} stage`
      );

      const processingError: ProcessingError = {
        code: 'CANCELLATION_NOT_ALLOWED',
        message: `Cannot cancel during ${session.progress.currentStage} stage`,
        recoverable: false,
        timestamp: Date.now(),
        stage: session.progress.currentStage,
      };

      session.errors.push(processingError);
      session.metrics.errorCount++;

      // Trigger error callback
      this.options.callbacks.onError?.(processingError);

      return;
    }

    this._applyStageChange(sessionId, session, 'cancelled', 0);
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): ProcessingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): ProcessingSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'active'
    );
  }

  /**
   * Clean up completed sessions
   */
  public cleanup(sessionId?: string): void {
    if (sessionId) {
      this.stopProgressUpdates(sessionId);
      this.sessions.delete(sessionId);
    } else {
      // Clean up all completed sessions
      for (const [id, session] of this.sessions.entries()) {
        if (session.status !== 'active') {
          this.cleanup(id);
        }
      }
    }
  }

  /**
   * Private: Complete session
   */
  private completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const now = Date.now();
    session.endTime = now;
    session.status = 'completed';

    // Calculate final metrics
    if (this.options.collectMetrics) {
      const totalTime = now - session.startTime;
      session.metrics.totalTime = totalTime;
      session.metrics.efficiency = calculateEfficiency(
        totalTime,
        session.timeEstimation.estimatedTime
      );
      session.metrics.throughput = 1000 / totalTime; // operations per second
    }

    this.stopProgressUpdates(sessionId);

    // Trigger completion callback
    this.options.callbacks.onComplete?.(session);
  }

  /**
   * Private: Start progress updates
   */
  private startProgressUpdates(sessionId: string): void {
    const interval = window.setInterval(() => {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'active') {
        this.stopProgressUpdates(sessionId);
        return;
      }

      const now = Date.now();
      const elapsedTime = now - session.startTime;

      // Update timing
      session.progress.currentTime = now;
      session.progress.elapsedTime = elapsedTime;

      // Check for delays
      if (
        isProcessingDelayed(elapsedTime, session.timeEstimation.estimatedTime)
      ) {
        // Could trigger delay warning here
      }

      // Update memory usage if available
      if (this.options.collectMetrics && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        session.metrics.memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // MB
      }

      // Trigger progress callback
      this.options.callbacks.onProgress?.(session.progress);
    }, this.options.updateInterval);

    this.updateIntervals.set(sessionId, interval);
  }

  /**
   * Private: Stop progress updates
   */
  private stopProgressUpdates(sessionId: string): void {
    const interval = this.updateIntervals.get(sessionId);
    if (interval) {
      window.clearInterval(interval);
      this.updateIntervals.delete(sessionId);
    }
  }

  /**
   * Private: Persist session to storage
   */
  private async persistSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      // Use sessionStorage for temporary persistence
      const key = `llava-progress-${sessionId}`;
      sessionStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to persist progress session:', error);
    }
  }

  /**
   * Load session from storage
   */
  public async loadSession(
    sessionId: string
  ): Promise<ProcessingSession | null> {
    try {
      const key = `llava-progress-${sessionId}`;
      const data = sessionStorage.getItem(key);
      if (data) {
        const session = JSON.parse(data) as ProcessingSession;
        this.sessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      console.warn('Failed to load progress session:', error);
    }
    return null;
  }

  /**
   * Clear session from storage
   */
  public async clearSession(sessionId: string): Promise<void> {
    try {
      const key = `llava-progress-${sessionId}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear progress session:', error);
    }
  }

  protected getStorageKey(sessionId: string): string {
    const key = `llava-progress-${sessionId}`;
    return key;
  }

  protected saveToStorage(sessionId: string, data: any): void {
    const key = `llava-progress-${sessionId}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error);
    }
  }

  protected loadFromStorage(sessionId: string): any {
    const key = `llava-progress-${sessionId}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error);
      return null;
    }
  }
}
