/**
 * AI Vision OCR API Route
 * Processes Romanian ID images using LLaVA model via Ollama
 * Accepts multipart/form-data uploads and returns structured JSON data
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  AIVisionOCRResponse,
  RomanianIDExtractionResult,
} from '@/lib/types/romanian-id-types';

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5vl:7b';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert file to base64 for Ollama
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Process extracted data to ensure proper structure and validate it's not just returning template values
 */
function processExtractedData(data: any): {
  data: any;
  isValid: boolean;
  invalidReason?: string;
} {
  // Ensure fields object exists
  if (!data.fields) {
    data.fields = {};
    return { data, isValid: false, invalidReason: 'Missing fields object' };
  }

  // If the model returned seria and numar but not seria_si_numarul, combine them
  if (data.fields.seria && data.fields.numar && !data.fields.seria_si_numarul) {
    data.fields.seria_si_numarul = `${data.fields.seria} ${data.fields.numar}`;
  }

  // Add empty confidence object if not provided by the model
  if (!data.confidence) {
    data.confidence = {};

    // Create confidence entries for each field
    for (const field in data.fields) {
      data.confidence[field] = {
        score: 0.7,
        level: 'medium',
        reason: 'Default confidence level',
      };
    }
  }

  // Ensure overall_confidence exists
  if (!data.overall_confidence) {
    data.overall_confidence = {
      score: 0.5,
      level: 'medium',
      reason: 'Default confidence level assigned due to missing data',
    };
  }

  // Check if the model just returned template values instead of actual extraction
  const templateValues = [
    'EXTRACTED SURNAME ONLY',
    'EXTRACTED GIVEN NAME(S) ONLY',
    '13 DIGITS WITH NO SPACES',
    'DD.MM.YYYY FORMAT',
    'EXTRACTED PLACE',
    'FULL ADDRESS',
    'SERIES 2 LETTERS ONLY',
    'NUMBER 6 DIGITS ONLY',
    'ISSUING AUTHORITY',
    'Surname',
    'Given name',
    'Birth date in DD.MM.YYYY format',
    'Place of birth',
    'Address/domicile',
    'Series (e.g., XX)',
    'Number (e.g., 123456)',
    'Series and number (e.g., XX 123456)',
    'Issue date in DD.MM.YYYY format',
    'Issuing authority',
    'Expiry date in DD.MM.YYYY format',
  ];

  // Check each field to see if it's a template value
  for (const field in data.fields) {
    const value = data.fields[field];
    if (
      typeof value === 'string' &&
      templateValues.some(template => value.includes(template))
    ) {
      return {
        data,
        isValid: false,
        invalidReason: `Field '${field}' contains template text: '${value}'. The model returned instructions instead of extracted data.`,
      };
    }
  }

  return { data, isValid: true };
}

/**
 * Create Romanian ID extraction prompt
 */
function createExtractionPrompt(): string {
  return `You are an expert Romanian document analyst specializing in Romanian ID cards (Carte de Identitate). Your task is to extract information with perfect accuracy.

RESPONSE FORMAT REQUIREMENT: YOU MUST RETURN ONLY JSON. DO NOT RETURN ANY TEXT, MARKDOWN OR EXPLANATION - ONLY VALID JSON.

DOCUMENT ANALYSIS INSTRUCTIONS:
1. Examine the image of the Romanian ID card systematically
2. Pay special attention to field labels and their corresponding values
3. Extract EXACTLY what is written on the document, preserving capitalization and diacritics
4. Distinguish between field labels and actual values
5. Be precise with surname vs given name fields

FIELD FORMATS AND GUIDELINES:

NUME (Surname/Family name):
- Extract only the surname/family name
- Usually appears in ALL CAPS with Romanian diacritics
- May contain hyphens for compound surnames
- Common locations: Near the "NUME:" or "NUME" label on the ID
- Example format: "POPESCU" or "STAN-IONESCU" (DO NOT USE THESE VALUES - extract the actual name)

PRENUME (Given name/First name):
- Extract only the given/first name(s)
- Usually appears in ALL CAPS with Romanian diacritics
- May contain multiple given names
- Common locations: Near the "PRENUME:" or "PRENUME" label on the ID
- Example format: "MARIA ELENA" or "ION" (DO NOT USE THESE VALUES - extract the actual name)

CNP (Personal Numeric Code):
- Must be exactly 13 digits with no spaces
- Common locations: Near the "CNP:" or "CNP" label on the ID
- Format: 13 consecutive digits

DATA NAȘTERII (Birth Date):
- Must be in DD.MM.YYYY format
- Has periods (.) between day, month, and year
- Common locations: Near the "DATA NAȘTERII:" label on the ID

LOCUL NAȘTERII (Birth Place):
- Usually a city or locality name
- May include county or region
- Common locations: Near the "LOCUL NAȘTERII:" label on the ID

DOMICILIUL (Address):
- Complete residential address
- May include street, number, block, apartment, city
- May split into multiple lines
- Common locations: Near the "DOMICILIUL:" label on the ID

SERIA (ID Series):
- Format: Letters only (usually 2 letters)
- Common locations: Near the "SERIA" label on the ID
- Examples: "XX", "AB", "CJ" (DO NOT USE THESE VALUES - extract the actual series)

NUMĂRUL (ID Number):
- Format: 6 digits with no spaces
- Common locations: Near the "NR." label on the ID
- Example: "123456" (DO NOT USE THIS VALUE - extract the actual number)

DATA ELIBERĂRII (Issue Date):
- Must be in DD.MM.YYYY format
- Has periods (.) between day, month, and year
- Common locations: Near the "DATA ELIBERĂRII:" label on the ID

ELIBERAT DE (Issuing Authority):
- Usually starts with "SPCLEP" followed by a location
- Common locations: Near the "ELIBERAT DE:" label on the ID

VALABIL PÂNĂ LA (Expiry Date):
- Must be in DD.MM.YYYY format
- Has periods (.) between day, month, and year
- Common locations: Near the "VALABIL PÂNĂ LA:" label on the ID

ROMANIAN ID CARD LAYOUT:
- Top section: ROMÂNIA, EU stars, etc.
- Middle left: Photo and signature
- Middle right: Personal information (name, CNP, birth)
- Bottom section: Address, series/number, dates, authority

OUTPUT FORMAT:
YOU MUST RETURN ONLY JSON. NO TEXT BEFORE OR AFTER THE JSON. Return exactly this structure:

{
  "fields": {
    "nume": "[EXTRACTED SURNAME ONLY]",
    "prenume": "[EXTRACTED GIVEN NAME(S) ONLY]",
    "cnp": "[13 DIGITS WITH NO SPACES]",
    "data_nasterii": "[DD.MM.YYYY FORMAT]",
    "locul_nasterii": "[EXTRACTED PLACE]",
    "domiciliul": "[FULL ADDRESS]",
    "seria": "[SERIES LETTERS ONLY]",
    "numar": "[6 DIGITS]",
    "data_eliberarii": "[DD.MM.YYYY FORMAT]",
    "eliberat_de": "[ISSUING AUTHORITY]",
    "valabil_pana_la": "[DD.MM.YYYY FORMAT]"
  },
  "overall_confidence": {
    "score": 0.0-1.0,
    "reason": "Overall assessment explanation",
    "level": "low|medium|high"
  }
}

CRITICAL RULES:
1. Return ONLY valid JSON, no additional text or markdown
2. If you cannot see a value clearly, use null for that field, but NEVER use the string "null"
3. EXTRACT ACTUAL TEXT from the document, not placeholders
4. SPLIT the person's name into surname (nume) and given name (prenume) correctly
5. The address may split into multiple lines, extract the full address
6. DO NOT make up information - if you can't see it, use null
7. Always preserve Romanian diacritics in text
8. If no ID document is visible, set all fields to null and explain in overall_confidence.
9. DO NOT USE PLACEHOLDER TEXT OR EXAMPLES - extract only the real data from the image
10. RESPOND ONLY WITH JSON - NO EXPLANATIONS BEFORE OR AFTER THE JSON`;
}

/**
 * Check if Ollama service is running
 */
async function checkOllamaStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Ollama status check failed:', error);
    return false;
  }
}

/**
 * Call Ollama API for image analysis
 */
async function callOllamaAPI(
  base64Image: string,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<{ result?: RomanianIDExtractionResult; error?: string }> {
  // First check if Ollama is running
  const ollamaRunning = await checkOllamaStatus();
  if (!ollamaRunning) {
    return {
      error:
        'Ollama service is not running or not accessible. Please start Ollama and try again.',
    };
  }

  const prompt = createExtractionPrompt();
  const startTime = Date.now();

  try {
    // Try OpenAI-compatible endpoint
    console.log('Calling Ollama API via OpenAI-compatible endpoint...');
    const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ollama', // Required but ignored
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: options.temperature || 0.0,
        max_tokens: options.max_tokens || 4000,
      }),
    });

    if (!response.ok) {
      console.warn(
        `OpenAI endpoint failed with status ${response.status}, trying native Ollama API`
      );
      return await callOllamaNativeAPI(base64Image, options);
    }

    const data = await response.json();

    // Process response content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error(
        'No content returned from AI model. Full response:',
        JSON.stringify(data)
      );
      return { error: 'No content returned from AI model' };
    }

    // Log the raw content for debugging
    console.log('Raw content from model:', content);

    // Handle markdown-formatted JSON responses
    let jsonContent = content;

    // Extract JSON from markdown code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
      console.log('Extracted JSON from markdown:', jsonContent);
    }

    // Clean up any remaining markdown artifacts
    jsonContent = jsonContent.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```$/, '');
      console.log('Cleaned up markdown artifacts:', jsonContent);
    }

    try {
      console.log('Attempting to parse JSON...');

      // Check if the content is not in JSON format
      if (!jsonContent.trim().startsWith('{')) {
        console.warn('Response is not in JSON format:', jsonContent);

        // Create a minimal valid response with empty fields
        return {
          result: {
            fields: {
              nume: null,
              prenume: null,
              cnp: null,
              data_nasterii: null,
              locul_nasterii: null,
              domiciliul: null,
              seria: null,
              numar: null,
              data_eliberarii: null,
              valabil_pana_la: null,
              eliberat_de: null,
            },
            metadata: {
              processing_time: Date.now() - startTime,
              model: OLLAMA_MODEL,
              image_quality: 'poor' as const,
              warnings: [
                'Model returned non-JSON response. Extraction failed.',
                `Raw response: "${jsonContent.substring(0, 100)}${jsonContent.length > 100 ? '...' : ''}"`,
              ],
            },
          },
        };
      }

      const extractedData = JSON.parse(jsonContent);

      // Log the raw extraction data for debugging
      console.log(
        'Raw extraction result:',
        JSON.stringify(extractedData, null, 2)
      );

      console.log('Validating extraction data...');
      const validation = processExtractedData(extractedData);

      if (!validation.isValid) {
        console.error('Validation failed:', validation.invalidReason);
        return {
          error: validation.invalidReason || 'Invalid extraction result',
        };
      }

      // Add confidence fields if not present in the model response
      if (!validation.data.confidence) {
        validation.data.confidence = {};

        // Create default confidence for each field
        for (const field in validation.data.fields) {
          validation.data.confidence[field] = {
            score: 0.7,
            level: 'medium',
            reason: 'Default confidence level',
          };
        }
      }

      const result: RomanianIDExtractionResult = {
        ...validation.data,
        metadata: {
          processing_time: Date.now() - startTime,
          model: OLLAMA_MODEL,
          image_quality: 'fair' as const,
          warnings: [],
        },
      };

      return { result };
    } catch (parseError) {
      return {
        error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }
  } catch (error) {
    // If OpenAI endpoint fails completely, try native Ollama API
    console.warn('OpenAI endpoint error, trying native API:', error);
    return await callOllamaNativeAPI(base64Image, options);
  }
}

/**
 * Fallback to native Ollama API
 */
async function callOllamaNativeAPI(
  base64Image: string,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<{ result?: RomanianIDExtractionResult; error?: string }> {
  const prompt = createExtractionPrompt();
  const startTime = Date.now();

  try {
    console.log('Calling Ollama API via native endpoint...');
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
            images: [base64Image], // Ollama format: images array with base64 strings
          },
        ],
        stream: false,
        options: {
          temperature: options.temperature || 0.0,
          num_predict: options.max_tokens || 4000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error(
        `Ollama API error: ${response.status}. Details:`,
        errorText
      );
      return {
        error: `Ollama API error: ${response.status}. Make sure Ollama is running.`,
      };
    }

    const data = await response.json();
    console.log('Native API response received:', JSON.stringify(data, null, 2));

    // Check for API errors
    if (data.error) {
      console.error(`Ollama error:`, data.error);
      return { error: `Ollama error: ${data.error}` };
    }

    const content = data.message?.content;

    if (!content) {
      console.error(
        'No content received from Ollama. Full response:',
        JSON.stringify(data)
      );
      return { error: 'No content received from Ollama' };
    }

    console.log('Raw content from model (native API):', content);

    // Handle markdown-formatted JSON responses
    let jsonContent = content;

    // Extract JSON from markdown code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
      console.log('Extracted JSON from markdown (native API):', jsonContent);
    }

    // Clean up any remaining markdown artifacts
    jsonContent = jsonContent.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```$/, '');
      console.log('Cleaned up markdown artifacts (native API):', jsonContent);
    }

    try {
      console.log('Attempting to parse JSON (native API)...');

      // Check if the content is not in JSON format
      if (!jsonContent.trim().startsWith('{')) {
        console.warn('Response is not in JSON format:', jsonContent);

        // Create a minimal valid response with empty fields
        return {
          result: {
            fields: {
              nume: null,
              prenume: null,
              cnp: null,
              data_nasterii: null,
              locul_nasterii: null,
              domiciliul: null,
              seria: null,
              numar: null,
              data_eliberarii: null,
              valabil_pana_la: null,
              eliberat_de: null,
            },
            metadata: {
              processing_time: Date.now() - startTime,
              model: OLLAMA_MODEL,
              image_quality: 'poor' as const,
              warnings: [
                'Model returned non-JSON response. Extraction failed.',
                `Raw response: "${jsonContent.substring(0, 100)}${jsonContent.length > 100 ? '...' : ''}"`,
              ],
            },
          },
        };
      }

      const extractedData = JSON.parse(jsonContent);

      // Log the raw extraction data for debugging
      console.log(
        'Raw extraction result (native API):',
        JSON.stringify(extractedData, null, 2)
      );

      console.log('Validating extraction data (native API)...');
      const validation = processExtractedData(extractedData);

      if (!validation.isValid) {
        console.error(
          'Validation failed (native API):',
          validation.invalidReason
        );
        return {
          error: validation.invalidReason || 'Invalid extraction result',
        };
      }

      // Add confidence fields if not present in the model response
      if (!validation.data.confidence) {
        validation.data.confidence = {};

        // Create default confidence for each field
        for (const field in validation.data.fields) {
          validation.data.confidence[field] = {
            score: 0.7,
            level: 'medium',
            reason: 'Default confidence level',
          };
        }
      }

      const result: RomanianIDExtractionResult = {
        ...validation.data,
        metadata: {
          processing_time: Date.now() - startTime,
          model: OLLAMA_MODEL,
          image_quality: 'fair' as const,
          warnings: [],
        },
      };

      return { result };
    } catch (parseError) {
      console.error(
        'JSON parse error (native API):',
        parseError,
        'Content:',
        jsonContent
      );
      return {
        error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('Ollama processing failed (native API):', error);
    return {
      error: `Ollama processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  try {
    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'No image file provided',
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

    // Validate image
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: 'File must be an image',
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

    // Check file size (10MB limit)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'IMAGE_TOO_LARGE',
            message: 'Image file too large (max 10MB)',
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

    // Get options from form data
    const temperature = formData.get('temperature');
    const maxTokens = formData.get('max_tokens');
    const enhanceImage = formData.get('enhance_image');

    const options = {
      temperature: temperature ? parseFloat(temperature as string) : 0.1,
      max_tokens: maxTokens ? parseInt(maxTokens as string) : 2000,
      enhance_image: enhanceImage ? enhanceImage === 'true' : true, // Default to true if not specified
    };

    // Process with Ollama
    try {
      const base64Image = await fileToBase64(image);
      // Apply additional image preprocessing for better OCR results
      const processedImage = await preprocessImage(
        base64Image,
        options.enhance_image
      );
      const { result, error } = await callOllamaAPI(processedImage, options);

      if (error || !result) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EXTRACTION_FAILED',
              message: error || 'Failed to extract data from image',
              details: error?.includes('Ollama')
                ? {
                    reason:
                      'Make sure Ollama is running and the correct model is installed. Run "ollama list" to check available models.',
                  }
                : undefined,
            },
            metadata: {
              request_id: requestId,
              timestamp: new Date().toISOString(),
              processing_time: Date.now() - startTime,
            },
          } as AIVisionOCRResponse,
          { status: 422 }
        );
      }

      // Update processing time
      result.metadata.processing_time = Date.now() - startTime;

      const response: AIVisionOCRResponse = {
        success: true,
        data: result,
        metadata: {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          processing_time: Date.now() - startTime,
        },
      };

      return NextResponse.json(response);
    } catch (ollamaError) {
      console.error('Ollama AI processing failed:', ollamaError);

      // Return proper error when AI processing fails
      const errorMessage =
        ollamaError instanceof Error
          ? ollamaError.message
          : 'AI processing service encountered an error';

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: errorMessage,
          },
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            processing_time: Date.now() - startTime,
          },
        } as AIVisionOCRResponse,
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Request processing failed:', error);

    const response: AIVisionOCRResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        processing_time: Date.now() - startTime,
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  // Test Ollama connection
  let ollamaStatus = 'unknown';
  let availableModels: string[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      ollamaStatus = 'connected';
      availableModels = data.models?.map((m: any) => m.name) || [];
    } else {
      ollamaStatus = 'error';
    }
  } catch (error) {
    ollamaStatus = 'unavailable';
  }

  return NextResponse.json({
    status: 'ok',
    service: 'AI Vision OCR',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    ollama: {
      status: ollamaStatus,
      url: OLLAMA_BASE_URL,
      model: OLLAMA_MODEL,
      available_models: availableModels,
      model_available: availableModels.includes(OLLAMA_MODEL),
    },
  });
}

/**
 * Apply preprocessing to image before sending to AI
 * This version is server-compatible and doesn't use browser APIs
 */
async function preprocessImage(
  base64Image: string,
  enhance: boolean = true
): Promise<string> {
  if (!enhance) {
    console.log('Image preprocessing skipped (enhance=false)');
    return base64Image;
  }

  try {
    // For server-side, we need to ensure the base64 string is properly formatted
    // Sometimes the base64 may include the data URL prefix, which we need to remove
    let cleanBase64 = base64Image;

    // Remove data URL prefix if present
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1] || cleanBase64;
      console.log('Removed data URL prefix from base64 image');
    }

    // Verify that the base64 string is valid
    try {
      Buffer.from(cleanBase64, 'base64');
      console.log('Base64 validation successful');
    } catch (e) {
      console.warn('Invalid base64 string:', e);
      return base64Image; // Return original if invalid
    }

    console.log(
      'Image preprocessing: using original image (server-side compatible mode)'
    );
    return cleanBase64;
  } catch (error) {
    console.warn('Image preprocessing failed:', error);
    return base64Image; // Return original if processing fails
  }
}
