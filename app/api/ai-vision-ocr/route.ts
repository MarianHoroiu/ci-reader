/**
 * AI Vision OCR API Endpoint
 * Processes Romanian ID images using Qwen2.5-VL model via Ollama
 * Accepts multipart/form-data uploads and returns structured JSON data
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateImageForAI } from '@/lib/validation/image-validator';
import {
  optimizeForRomanianID,
  estimateProcessingTime,
} from '@/lib/ai/image-handler';
import {
  processRomanianIDWithQwen,
  type QwenVisionOptions,
} from '@/lib/ai/qwen-vision-processor';
import {
  createSuccessResponse,
  createErrorResponse,
  createErrorDetails,
  generateRequestId,
  createPerformanceMetrics,
  logResponse,
  sanitizeResponseData,
  validateResponseData,
  type ResponseMetadata,
} from '@/lib/utils/response-formatter';
import { ollamaClient } from '@/lib/ai/ollama-client';
import {
  AI_VISION_ERROR_CODES,
  type AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';

// Request timeout (8 seconds as per requirements)
const REQUEST_TIMEOUT = 8000;

// Maximum concurrent requests
const MAX_CONCURRENT_REQUESTS = 3;

// Simple in-memory request tracking
let activeRequests = 0;

/**
 * POST /api/ai-vision-ocr
 * Processes Romanian ID images and extracts structured data
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Check concurrent request limit
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    const response = createErrorResponse(
      createErrorDetails(
        AI_VISION_ERROR_CODES.PROCESSING_TIMEOUT,
        'Server is busy processing other requests. Please try again in a few seconds.',
        { active_requests: activeRequests }
      ),
      {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
      }
    );

    return NextResponse.json(response, { status: 429 });
  }

  activeRequests++;

  try {
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, REQUEST_TIMEOUT);
    });

    // Process the request with timeout
    const result = await Promise.race([
      processRequest(request, requestId, startTime),
      timeoutPromise,
    ]);

    return result;
  } catch (error) {
    console.error('[AI Vision OCR] Request failed:', error);

    const errorCode: AIVisionErrorCode =
      error instanceof Error && error.message === 'Request timeout'
        ? AI_VISION_ERROR_CODES.PROCESSING_TIMEOUT
        : AI_VISION_ERROR_CODES.INTERNAL_ERROR;

    const response = createErrorResponse(
      createErrorDetails(
        errorCode,
        error instanceof Error ? error.message : 'Unknown error occurred'
      ),
      {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
      }
    );

    const statusCode =
      errorCode === AI_VISION_ERROR_CODES.PROCESSING_TIMEOUT ? 408 : 500;
    return NextResponse.json(response, { status: statusCode });
  } finally {
    activeRequests--;
  }
}

/**
 * Processes the actual request
 */
async function processRequest(
  request: NextRequest,
  requestId: string,
  startTime: number
): Promise<NextResponse> {
  try {
    // Check if Ollama service is available
    const healthCheck = await ollamaClient.healthCheck();
    if (healthCheck.status === 'error') {
      const response = createErrorResponse(
        createErrorDetails(
          AI_VISION_ERROR_CODES.MODEL_UNAVAILABLE,
          'AI service is currently unavailable. Please try again later.',
          { service_error: healthCheck.message }
        ),
        {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        }
      );

      return NextResponse.json(response, { status: 503 });
    }

    // Check if model is available
    const isModelAvailable = await ollamaClient.isModelAvailable();
    if (!isModelAvailable) {
      const response = createErrorResponse(
        createErrorDetails(
          AI_VISION_ERROR_CODES.MODEL_UNAVAILABLE,
          'Qwen2.5-VL model is not available. Please ensure the model is installed.',
          { model: ollamaClient.getConfig().model }
        ),
        {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        }
      );

      return NextResponse.json(response, { status: 503 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const customPrompt = formData.get('custom_prompt') as string | null;
    const temperatureStr = formData.get('temperature') as string | null;
    const maxTokensStr = formData.get('max_tokens') as string | null;
    const enhanceImageStr = formData.get('enhance_image') as string | null;

    // Validate image file
    if (!imageFile) {
      const response = createErrorResponse(
        createErrorDetails(
          AI_VISION_ERROR_CODES.INVALID_IMAGE,
          'No image file provided. Please upload a Romanian ID image.'
        ),
        {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        }
      );

      return NextResponse.json(response, { status: 400 });
    }

    // Validate image for AI processing
    const validationStartTime = Date.now();
    const validation = await validateImageForAI(imageFile);
    const validationTime = Date.now() - validationStartTime;

    if (!validation.isValid) {
      const response = createErrorResponse(
        createErrorDetails(
          validation.errorCode || AI_VISION_ERROR_CODES.INVALID_IMAGE,
          validation.errorMessage || 'Image validation failed',
          {
            validation_details: validation.details,
            file_size: validation.fileSize,
            mime_type: validation.mimeType,
          }
        ),
        {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        }
      );

      return NextResponse.json(response, { status: 400 });
    }

    // Estimate processing time
    const estimatedTime = estimateProcessingTime(
      imageFile,
      validation.dimensions
    );
    console.log(
      `[AI Vision OCR] Estimated processing time: ${estimatedTime}ms`
    );

    // Process image for AI
    const preprocessingStartTime = Date.now();
    const imageProcessingResult = await optimizeForRomanianID(imageFile);
    const preprocessingTime = Date.now() - preprocessingStartTime;

    // Parse processing options
    const processingOptions: QwenVisionOptions = {};

    if (temperatureStr) {
      processingOptions.temperature = parseFloat(temperatureStr);
    }
    if (maxTokensStr) {
      processingOptions.max_tokens = parseInt(maxTokensStr, 10);
    }
    if (customPrompt) {
      processingOptions.custom_prompt = customPrompt;
    }
    processingOptions.enhance_image = enhanceImageStr === 'true';

    // Process with Qwen model
    const qwenResult = await processRomanianIDWithQwen(
      imageProcessingResult.base64,
      processingOptions
    );

    const totalTime = Date.now() - startTime;

    if (!qwenResult.success) {
      const errorMetadata: Partial<ResponseMetadata> = {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: totalTime,
      };

      if (qwenResult.performance) {
        errorMetadata.performance = createPerformanceMetrics(
          qwenResult.performance.model_time,
          preprocessingTime + validationTime,
          qwenResult.performance.parsing_time
        );
      }

      const response = createErrorResponse(
        createErrorDetails(
          qwenResult.error?.code || AI_VISION_ERROR_CODES.EXTRACTION_FAILED,
          qwenResult.error?.message || 'Failed to extract Romanian ID data',
          {
            qwen_error: qwenResult.error?.details,
            raw_response: qwenResult.raw_response?.substring(0, 500),
            performance: qwenResult.performance,
          }
        ),
        errorMetadata
      );

      return NextResponse.json(response, { status: 422 });
    }

    // Validate extraction result
    if (!qwenResult.data) {
      const response = createErrorResponse(
        createErrorDetails(
          AI_VISION_ERROR_CODES.EXTRACTION_FAILED,
          'No data extracted from the Romanian ID image'
        ),
        {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: totalTime,
        }
      );

      return NextResponse.json(response, { status: 422 });
    }

    // Validate response data structure
    const dataValidation = validateResponseData(qwenResult.data);
    if (!dataValidation.isValid) {
      console.warn(
        '[AI Vision OCR] Response validation issues:',
        dataValidation.issues
      );
    }

    // Sanitize response data
    const sanitizedData = sanitizeResponseData(qwenResult.data);

    // Create successful response
    const successMetadata: ResponseMetadata = {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      processing_time: totalTime,
      performance: createPerformanceMetrics(
        qwenResult.performance.model_time,
        preprocessingTime + validationTime,
        qwenResult.performance.parsing_time
      ),
    };

    const response = createSuccessResponse(sanitizedData, successMetadata);

    // Log successful response
    const userAgent = request.headers.get('user-agent');
    const logInfo: { fileSize: number; userAgent?: string } = {
      fileSize: imageFile.size,
    };
    if (userAgent) {
      logInfo.userAgent = userAgent;
    }

    logResponse(response, logInfo);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[AI Vision OCR] Processing error:', error);

    const response = createErrorResponse(
      createErrorDetails(
        AI_VISION_ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred during processing',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      ),
      {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
      }
    );

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET /api/ai-vision-ocr
 * Returns API information and health status
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check service health
    const healthCheck = await ollamaClient.healthCheck();
    const isModelAvailable = await ollamaClient.isModelAvailable();

    const status =
      healthCheck.status === 'ok' && isModelAvailable ? 'healthy' : 'unhealthy';

    const info = {
      service: 'AI Vision OCR for Romanian ID Processing',
      version: '1.0.0',
      status,
      model: ollamaClient.getConfig().model,
      capabilities: [
        'Romanian ID field extraction',
        'Image preprocessing and optimization',
        'Confidence scoring',
        'GDPR-compliant local processing',
      ],
      supported_formats: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
      ],
      max_file_size: '10MB',
      max_processing_time: '8 seconds',
      active_requests: activeRequests,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(info, {
      status: status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: 'AI Vision OCR for Romanian ID Processing',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
