/**
 * Qwen2.5-VL Progress Tracker
 * Manages processing sessions and real-time progress updates
 */

import type {
  ProcessingStage,
  ProcessingProgress,
  ProcessingSession,
  ProcessingError,
  ProcessingMetrics,
  ProgressTrackerOptions,
  CancellationToken,
} from '@/lib/types/progress-types';

import {
  calculateOverallProgress,
  isStageCancellable,
  isValidStageTransition,
  QWEN_PROCESSING_CONFIG,
} from '@/lib/progress/processing-stages';

import {
  calculateTimeEstimation,
  updateTimeEstimation,
  calculateRemainingTime,
  calculateProcessingSpeed,
  calculateEfficiency,
  isProcessingDelayed,
} from '@/lib/utils/time-estimator';

/**
 * Progress tracker for Qwen2.5-VL processing operations
 */
export class QwenProgressTracker {
  private sessions = new Map<string, ProcessingSession>();
  private updateIntervals = new Map<string, number>();
  private cancellationTokens = new Map<string, CancellationToken>();
  private options: Required<ProgressTrackerOptions>;

  constructor(options: ProgressTrackerOptions = {}) {
    this.options = {
      updateInterval: options.updateInterval ?? 100, // 100ms updates
      collectMetrics: options.collectMetrics ?? true,
      persistProgress: options.persistProgress ?? true,
      maxRetries: options.maxRetries ?? 3,
      timeout:
        options.timeout ??
        QWEN_PROCESSING_CONFIG.performanceThresholds.maxProcessingTime,
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

    // Create cancellation token
    const cancellationToken = this.createCancellationToken(sessionId);
    this.cancellationTokens.set(sessionId, cancellationToken);

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

    // Validate stage transition
    if (!isValidStageTransition(currentStage, newStage)) {
      this.handleError(sessionId, {
        code: 'INVALID_STAGE_TRANSITION',
        message: `Invalid stage transition from ${currentStage} to ${newStage}`,
        recoverable: false,
        timestamp: Date.now(),
      });
      return;
    }

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

    const clampedProgress = Math.max(0, Math.min(100, progress));
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

    // Non-recoverable error or max retries exceeded
    this.updateStage(sessionId, 'error');
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
      this.handleError(sessionId, {
        code: 'CANCELLATION_NOT_ALLOWED',
        message: `Cannot cancel during ${session.progress.currentStage} stage`,
        recoverable: false,
        timestamp: Date.now(),
      });
      return;
    }

    // Trigger cancellation token
    const cancellationToken = this.cancellationTokens.get(sessionId);
    if (cancellationToken) {
      cancellationToken.cancel();
    }

    this.updateStage(sessionId, 'cancelled');
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
      this.cancellationTokens.delete(sessionId);
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
   * Get cancellation token for session
   */
  public getCancellationToken(
    sessionId: string
  ): CancellationToken | undefined {
    return this.cancellationTokens.get(sessionId);
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
   * Private: Create cancellation token
   */
  private createCancellationToken(_sessionId: string): CancellationToken {
    let isCancelled = false;
    const callbacks: (() => void)[] = [];

    return {
      get isCancelled() {
        return isCancelled;
      },
      cancel() {
        if (!isCancelled) {
          isCancelled = true;
          callbacks.forEach(callback => callback());
        }
      },
      onCancelled(callback: () => void) {
        if (isCancelled) {
          callback();
        } else {
          callbacks.push(callback);
        }
      },
    };
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
      const key = `qwen-progress-${sessionId}`;
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
      const key = `qwen-progress-${sessionId}`;
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
      const key = `qwen-progress-${sessionId}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear progress session:', error);
    }
  }
}
