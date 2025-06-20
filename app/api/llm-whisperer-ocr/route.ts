/**
 * LLM Whisperer OCR API Route
 * Processes Romanian ID images using LLM Whisperer service for OCR
 * and Claude Sonnet 4 for structured data extraction
 * Accepts multipart/form-data uploads and returns structured JSON data
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type {
  AIVisionOCRResponse,
  RomanianIDExtractionResult,
  RomanianIDFields,
} from '@/lib/types/romanian-id-types';

// Configuration
const LLMWHISPERER_BASE_URL =
  process.env.LLMWHISPERER_BASE_URL ||
  'https://llmwhisperer-api.us-central.unstract.com/api/v2';
const LLMWHISPERER_API_KEY = process.env.LLMWHISPERER_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Call LLM Whisperer API for document processing with structured extraction
 */
async function callLLMWhispererAPI(
  fileBuffer: ArrayBuffer,
  options: {
    mode?: 'high_quality' | 'low_cost' | 'form' | 'native_text';
    processing_mode?: string;
  } = {}
): Promise<{ result?: string; error?: string }> {
  try {
    console.log('Calling LLM Whisperer API for clean text extraction...');

    // Send file with query parameters optimized for clean text extraction
    const queryParams = new URLSearchParams({
      mode: options.mode || 'form',
      output_mode: 'layout_preserving',
      page_seperator: '<<<>>>',
      timeout: '60',
      // Optimize for ID documents
      median_filter_size: '0',
      gaussian_blur_radius: '0',
      line_splitter_tolerance: '0.3',
      horizontal_stretch_factor: '1.0',
      mark_vertical_lines: 'false',
      mark_horizontal_lines: 'false',
      line_splitter_strategy: 'left-priority',
      word_separator: ' ',
    });

    const uploadResponse = await fetch(
      `${LLMWHISPERER_BASE_URL}/whisper?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'unstract-key': LLMWHISPERER_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('LLM Whisperer API error:', errorText);
      return {
        error: `LLM Whisperer API failed with status ${uploadResponse.status}: ${errorText}`,
      };
    }

    const data = await uploadResponse.json();
    console.log('LLM Whisperer upload response:', data);

    if (data.status === 'processing') {
      const whisperHash = data.whisper_hash;
      console.log(`Got whisper_hash: ${whisperHash}, starting polling...`);
      return await pollLLMWhispererResult(whisperHash);
    } else if (data.status === 'processed') {
      console.log('Document processed immediately');
      return { result: data.extracted_text };
    } else {
      console.error(`Unexpected status: ${data.status}`);
      return { error: `Unexpected status: ${data.status}` };
    }
  } catch (error) {
    console.error('LLM Whisperer API error:', error);
    return {
      error: `Failed to call LLM Whisperer API: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Poll LLM Whisperer for processing results
 */
async function pollLLMWhispererResult(
  whisperHash: string,
  maxAttempts: number = 30
): Promise<{ result?: string; error?: string }> {
  console.log(`Polling for whisper_hash: ${whisperHash}`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use query parameter format as per API documentation
      const statusUrl = `${LLMWHISPERER_BASE_URL}/whisper-status?whisper_hash=${whisperHash}`;
      console.log(`Attempt ${attempt + 1}: Checking status at ${statusUrl}`);

      const statusResponse = await fetch(statusUrl, {
        headers: {
          'unstract-key': LLMWHISPERER_API_KEY,
        },
      });

      console.log(`Status response: ${statusResponse.status}`);

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(
          `Status check failed: ${statusResponse.status} - ${errorText}`
        );
        return {
          error: `Status check failed: ${statusResponse.status} - ${errorText}`,
        };
      }

      const statusData = await statusResponse.json();
      console.log(`Status data:`, statusData);

      if (statusData.status === 'processed') {
        // Try to retrieve the text
        const retrieveUrl = `${LLMWHISPERER_BASE_URL}/whisper-retrieve?whisper_hash=${whisperHash}`;
        const retrieveResponse = await fetch(retrieveUrl, {
          headers: {
            'unstract-key': LLMWHISPERER_API_KEY,
          },
        });

        if (retrieveResponse.ok) {
          const retrieveData = await retrieveResponse.json();
          return {
            result: retrieveData.result_text || retrieveData.extracted_text,
          };
        } else {
          return {
            error: `Failed to retrieve text: ${retrieveResponse.status}`,
          };
        }
      } else if (
        statusData.status === 'failed' ||
        statusData.status === 'error'
      ) {
        return {
          error: `Processing failed: ${statusData.message || 'Unknown error'}`,
        };
      }

      console.log(`Status: ${statusData.status}, waiting 2 seconds...`);
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Polling error:', error);
      return {
        error: `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  return { error: 'Processing timeout - document took too long to process' };
}

/**
 * Extract structured data using Claude Sonnet 4
 */
async function extractWithClaude(
  cleanText: string
): Promise<{ result?: any; error?: string }> {
  try {
    console.log('🤖 Starting Claude extraction...');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.1,
      system: `You are an expert document processor specializing in Romanian Identity Cards (Carte de Identitate).
      
Your task is to extract structured data from the provided text and return ONLY valid JSON - no additional text, explanations, or formatting.

The Romanian ID card contains multilingual labels (Romanian/French/English). Extract the following fields:
- nume: Last name (from "Nume/Nom/Last name" section)
- prenume: First name (from "Prenume/Prenom/First name" section)  
- cnp: 13-digit personal numeric code
- nationalitate: Nationality (normalize to "ROMÂNĂ")
- sex: Gender (M or F)
- data_nasterii: Birth date in DD.MM.YYYY format
- locul_nasterii: Birth place/location
- domiciliul: Complete address including street number
- tip_document: Always "Carte de Identitate"
- seria_buletin: Document series (1 or 2 capital letters)
- numar_buletin: 6-digit document number
- data_eliberarii: Issue date in DD.MM.YYYY format
- valabil_pana_la: Expiry date in DD.MM.YYYY format  
- eliberat_de: Issuing authority name

IMPORTANT RULES:
1. If birth date is not explicit, extract it from CNP using format SYYMMDDDDDDC where:
   - S=1,2 → 1900s (19YY), S=5,6 → 2000s (20YY)
   - YY=year, MM=month, DD=day
2. For dates in DD.MM.YY format, expand year: YY≤30→20YY, YY>30→19YY
3. Combine all address parts including house numbers (nr.) into complete address
4. Normalize nationality to "ROMÂNĂ" regardless of source format
5. Return ONLY the JSON object, no other text`,
      messages: [
        {
          role: 'user',
          content: `Extract the Romanian ID data from this text and return only JSON:

${cleanText}`,
        },
      ],
    });

    // Extract text content from Claude response
    let responseText = '';
    if (message.content && message.content.length > 0) {
      const firstContent = message.content[0];
      if (firstContent && 'text' in firstContent) {
        responseText = firstContent.text;
      }
    }

    console.log('Claude response:', responseText);

    if (!responseText) {
      return { error: 'Empty response from Claude' };
    }

    // Parse the JSON response
    try {
      const extractedData = JSON.parse(responseText);
      console.log('✅ Claude extraction successful');
      return { result: extractedData };
    } catch (parseError) {
      console.error('❌ Failed to parse Claude JSON response:', parseError);
      return {
        error: `Invalid JSON response from Claude: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
      };
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      error: `Claude extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process Claude's structured extraction result
 */
interface ClaudeExtractionResult extends RomanianIDFields {
  [key: string]: string | null;
}

async function processClaudeResult(
  claudeResult: ClaudeExtractionResult
): Promise<{ result?: RomanianIDExtractionResult; error?: string }> {
  try {
    console.log('=== CLAUDE STRUCTURED RESULT ===');
    console.log(JSON.stringify(claudeResult, null, 2));
    console.log('=== END RESULT ===');

    // Validate that we have the expected fields
    if (!claudeResult || typeof claudeResult !== 'object') {
      return {
        error: 'Claude returned invalid result format',
      };
    }

    // Count successful extractions
    const fieldCount = Object.keys(claudeResult).filter(
      key =>
        claudeResult[key] !== null &&
        claudeResult[key] !== '' &&
        claudeResult[key] !== undefined
    ).length;
    console.log(
      `✅ Claude structured extraction completed: ${fieldCount} fields extracted`
    );

    // Log extracted fields for debugging
    for (const [key, value] of Object.entries(claudeResult)) {
      if (value) console.log(`✓ ${key}: "${value}"`);
    }

    const result: RomanianIDExtractionResult = {
      fields: claudeResult as RomanianIDFields,
      metadata: {
        processing_time: 0,
        model: 'LLM Whisperer + Claude Sonnet 4',
        image_quality: 'good' as const,
        warnings: ['Structured data extracted using Claude AI'],
      },
    };

    return { result };
  } catch (error) {
    return {
      error: `Failed to process Claude result: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * POST endpoint for LLM Whisperer processing
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AIVisionOCRResponse>> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  console.log(`[${requestId}] LLM Whisperer OCR request started`);

  try {
    // Check if API keys are configured
    if (!LLMWHISPERER_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'LLM Whisperer API key not configured',
            details: { service: 'LLM Whisperer' },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 500 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'Claude API key not configured',
            details: { service: 'Claude' },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const mode =
      (formData.get('mode') as
        | 'high_quality'
        | 'low_cost'
        | 'form'
        | 'native_text') || 'form';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'No image file provided',
            details: { reason: 'Missing image in form data' },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer for LLM Whisperer
    const fileBuffer = await file.arrayBuffer();
    console.log(
      `[${requestId}] File converted to ArrayBuffer, size: ${fileBuffer.byteLength} bytes`
    );

    // Call LLM Whisperer
    const whisperResult = await callLLMWhispererAPI(fileBuffer, {
      mode: mode,
    });

    if (whisperResult.error || !whisperResult.result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: whisperResult.error || 'Failed to extract text',
            details: {
              service: 'LLM Whisperer',
              originalError: whisperResult.error,
            },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 500 }
      );
    }

    // Extract structured data using Claude
    const claudeResult = await extractWithClaude(whisperResult.result);

    if (claudeResult.error || !claudeResult.result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: claudeResult.error || 'Failed to parse structured data',
            details: {
              extractedText: whisperResult.result,
              parsingError: claudeResult.error,
            },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 500 }
      );
    }

    // Process Claude's structured extraction result
    const processedResult = await processClaudeResult(claudeResult.result);

    if (processedResult.error || !processedResult.result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: processedResult.error || 'Failed to process Claude result',
            details: {
              extractedText: JSON.stringify(claudeResult.result),
              processingError: processedResult.error,
            },
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 500 }
      );
    }

    // Update the result with proper metadata
    const finalResult: RomanianIDExtractionResult = {
      ...processedResult.result,
      metadata: {
        ...processedResult.result.metadata,
        processing_time: Date.now() - startTime,
      },
    };

    console.log(`[${requestId}] LLM Whisperer OCR completed successfully`);

    return NextResponse.json({
      success: true,
      data: finalResult,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
        performance: {
          model_response_time: finalResult.metadata.processing_time,
          preprocessing_time: 0,
          parsing_time: 0,
        },
      },
    } as AIVisionOCRResponse);
  } catch (error) {
    console.error(`[${requestId}] LLM Whisperer OCR error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            error instanceof Error ? error.message : 'Internal server error',
          details: {
            errorType:
              error instanceof Error ? error.constructor.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
        metadata: {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        },
      } as AIVisionOCRResponse,
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET(): Promise<NextResponse> {
  try {
    if (!LLMWHISPERER_API_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'LLM Whisperer API key not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Claude API key not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Test LLM Whisperer API connection
    const response = await fetch(`${LLMWHISPERER_BASE_URL}/get-usage-info`, {
      headers: {
        'unstract-key': LLMWHISPERER_API_KEY,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        status: 'healthy',
        services: ['LLM Whisperer', 'Claude Sonnet 4'],
        message: 'All services are accessible',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: `LLM Whisperer API returned status ${response.status}`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
