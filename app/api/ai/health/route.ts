/**
 * AI Health Check API Endpoint
 * Verifies Ollama service and Qwen2.5-VL model availability
 * Used for system monitoring and troubleshooting
 */

import { NextRequest, NextResponse } from 'next/server';
import { ollamaClient } from '../../../lib/ai/ollama-client';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    ollama: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    model: {
      status: 'available' | 'unavailable' | 'unknown';
      name: string;
      message?: string;
    };
  };
  system: {
    environment: string;
    version: string;
  };
}

/**
 * GET /api/ai/health
 * Returns the health status of AI services
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<HealthCheckResponse>> {
  try {
    // Check Ollama service health
    const ollamaHealthStart = Date.now();
    const ollamaHealth = await ollamaClient.healthCheck();
    const ollamaResponseTime = Date.now() - ollamaHealthStart;

    // Check model availability
    const modelConfig = ollamaClient.getConfig();
    const isModelAvailable = await ollamaClient.isModelAvailable();

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (ollamaHealth.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (!isModelAvailable) {
      overallStatus = 'degraded';
    }

    // Build ollama service info
    const ollamaServiceInfo: HealthCheckResponse['services']['ollama'] = {
      status: ollamaHealth.status,
      responseTime: ollamaResponseTime,
    };

    if (ollamaHealth.message) {
      ollamaServiceInfo.message = ollamaHealth.message;
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        ollama: ollamaServiceInfo,
        model: {
          status: isModelAvailable ? 'available' : 'unavailable',
          name: modelConfig.model,
          message: isModelAvailable
            ? 'Model is ready for processing'
            : `Model ${modelConfig.model} is not available. Please run: ollama pull ${modelConfig.model}`,
        },
      },
      system: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    // Set appropriate HTTP status code
    const httpStatus =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 206
          : 503;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error('[Health Check] Error:', error);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        ollama: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        model: {
          status: 'unknown',
          name: ollamaClient.getConfig().model,
          message: 'Unable to check model status due to service error',
        },
      },
      system: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * POST /api/ai/health
 * Performs a more comprehensive health check including model testing
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get basic health status first
    const basicHealthResponse = await GET(request);
    const basicHealth =
      (await basicHealthResponse.json()) as HealthCheckResponse;

    // If basic health is unhealthy, return early
    if (basicHealth.status === 'unhealthy') {
      return basicHealthResponse;
    }

    // Perform model test if model is available
    let modelTestResult = null;
    if (basicHealth.services.model.status === 'available') {
      try {
        const testStart = Date.now();
        modelTestResult = await ollamaClient.testModel();
        const testDuration = Date.now() - testStart;

        modelTestResult = {
          ...modelTestResult,
          duration: testDuration,
        };
      } catch (error) {
        modelTestResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Model test failed',
          duration: 0,
        };
      }
    }

    // Enhanced response with test results
    const enhancedResponse = {
      ...basicHealth,
      test: {
        performed: modelTestResult !== null,
        result: modelTestResult,
      },
    };

    // Update status based on test results
    if (modelTestResult && !modelTestResult.success) {
      enhancedResponse.status = 'degraded';
      enhancedResponse.services.model.message =
        'Model is available but not responding correctly';
    }

    const httpStatus =
      enhancedResponse.status === 'healthy'
        ? 200
        : enhancedResponse.status === 'degraded'
          ? 206
          : 503;

    return NextResponse.json(enhancedResponse, { status: httpStatus });
  } catch (error) {
    console.error('[Health Check] Enhanced test error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
