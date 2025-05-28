/**
 * Qwen2.5-VL Vision Processor for Romanian ID Extraction
 * Specialized wrapper around OllamaClient for Romanian ID document processing
 */

import { ollamaClient } from './ollama-client';
import type {
  RomanianIDFields,
  RomanianIDExtractionResult,
  FieldConfidence,
  AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';
import { AI_VISION_ERROR_CODES } from '@/lib/types/romanian-id-types';

export interface QwenVisionOptions {
  /** Temperature for model generation (0-1) */
  temperature?: number;
  /** Maximum tokens for response */
  max_tokens?: number;
  /** Custom extraction prompt */
  custom_prompt?: string;
  /** Enable enhanced preprocessing */
  enhance_image?: boolean;
}

export interface QwenProcessingResult {
  /** Extraction success status */
  success: boolean;
  /** Extracted Romanian ID data */
  data?: RomanianIDExtractionResult;
  /** Error information if processing failed */
  error?: {
    code: AIVisionErrorCode;
    message: string;
    details?: any;
  };
  /** Raw model response for debugging */
  raw_response?: string;
  /** Processing performance metrics */
  performance: {
    total_time: number;
    model_time: number;
    parsing_time: number;
  };
}

/**
 * Default prompt optimized for Qwen2.5-VL-7B-Instruct
 */
const DEFAULT_ROMANIAN_ID_PROMPT = `
Analyze this Romanian ID document image carefully and extract all visible information.

You are an expert at reading Romanian identity cards (Carte de Identitate). Extract the following fields if visible and legible:

REQUIRED FIELDS:
- nume: Full name (Nume și Prenume)
- cnp: Personal Numeric Code (CNP) - 13 digits
- data_nasterii: Date of birth (Data nașterii) - format DD.MM.YYYY
- locul_nasterii: Place of birth (Locul nașterii)
- domiciliul: Address/Domicile (Domiciliul)
- seria_si_numarul: ID series and number (Seria și numărul)
- data_eliberarii: Issue date (Data eliberării) - format DD.MM.YYYY
- eliberat_de: Issuing authority (Eliberat de)
- valabil_pana_la: Validity date (Valabil până la) - format DD.MM.YYYY

INSTRUCTIONS:
1. Look carefully at the image and identify text in Romanian
2. Handle Romanian diacritics correctly (ă, â, î, ș, ț)
3. If a field is not visible, unclear, or damaged, use null
4. For dates, use DD.MM.YYYY format
5. For CNP, ensure it's exactly 13 digits
6. Return ONLY valid JSON with the exact field names above

RESPONSE FORMAT:
Return a valid JSON object with the extracted fields. Example:
{
  "nume": "POPESCU MARIA ELENA",
  "cnp": "2850123456789",
  "data_nasterii": "23.01.1985",
  "locul_nasterii": "BUCUREȘTI",
  "domiciliul": "STR. VICTORIEI NR. 15, BUCUREȘTI",
  "seria_si_numarul": "RX 123456",
  "data_eliberarii": "15.06.2020",
  "eliberat_de": "SPCLEP BUCUREȘTI",
  "valabil_pana_la": "15.06.2030"
}

Now analyze the image and extract the information:
`;

/**
 * Processes a Romanian ID image using Qwen2.5-VL model
 */
export async function processRomanianIDWithQwen(
  imageBase64: string,
  options: QwenVisionOptions = {}
): Promise<QwenProcessingResult> {
  const startTime = Date.now();

  try {
    // Prepare processing options
    const processingOptions = {
      temperature: options.temperature ?? 0.1, // Low temperature for consistent extraction
      max_tokens: options.max_tokens ?? 2048,
      num_ctx: 4096, // Large context for document processing
    };

    // Use custom prompt or default
    const prompt = options.custom_prompt || DEFAULT_ROMANIAN_ID_PROMPT;

    // Call Ollama model
    const modelStartTime = Date.now();
    const response = await ollamaClient.generateWithImage(
      prompt,
      imageBase64,
      processingOptions
    );
    const modelTime = Date.now() - modelStartTime;

    // Parse the response
    const parsingStartTime = Date.now();
    const parseResult = await parseQwenResponse(response.response);
    const parsingTime = Date.now() - parsingStartTime;

    const totalTime = Date.now() - startTime;

    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code:
            parseResult.error?.code || AI_VISION_ERROR_CODES.EXTRACTION_FAILED,
          message: parseResult.error?.message || 'Extraction failed',
          details: parseResult.error?.details,
        },
        raw_response: response.response,
        performance: {
          total_time: totalTime,
          model_time: modelTime,
          parsing_time: parsingTime,
        },
      };
    }

    // Build extraction result with confidence scoring
    const extractionResult: RomanianIDExtractionResult = {
      fields: parseResult.fields || {
        nume: null,
        cnp: null,
        data_nasterii: null,
        locul_nasterii: null,
        domiciliul: null,
        seria_si_numarul: null,
        data_eliberarii: null,
        eliberat_de: null,
        valabil_pana_la: null,
      },
      confidence: calculateFieldConfidence(
        parseResult.fields || {
          nume: null,
          cnp: null,
          data_nasterii: null,
          locul_nasterii: null,
          domiciliul: null,
          seria_si_numarul: null,
          data_eliberarii: null,
          eliberat_de: null,
          valabil_pana_la: null,
        },
        response.response
      ),
      overall_confidence: calculateOverallConfidence(
        parseResult.fields || {
          nume: null,
          cnp: null,
          data_nasterii: null,
          locul_nasterii: null,
          domiciliul: null,
          seria_si_numarul: null,
          data_eliberarii: null,
          eliberat_de: null,
          valabil_pana_la: null,
        }
      ),
      metadata: {
        processing_time: totalTime,
        model: ollamaClient.getConfig().model,
        image_quality: assessImageQualityFromResponse(response.response),
        warnings: extractWarnings(response.response),
      },
    };

    return {
      success: true,
      data: extractionResult,
      raw_response: response.response,
      performance: {
        total_time: totalTime,
        model_time: modelTime,
        parsing_time: parsingTime,
      },
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;

    return {
      success: false,
      error: {
        code: AI_VISION_ERROR_CODES.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : 'Unknown processing error',
        details: error,
      },
      performance: {
        total_time: totalTime,
        model_time: 0,
        parsing_time: 0,
      },
    };
  }
}

/**
 * Parses Qwen model response to extract Romanian ID fields
 */
async function parseQwenResponse(response: string): Promise<{
  success: boolean;
  fields?: RomanianIDFields;
  error?: {
    code: AIVisionErrorCode;
    message: string;
    details?: any;
  };
}> {
  try {
    // Clean the response - remove any markdown formatting or extra text
    let cleanedResponse = response.trim();

    // Look for JSON content between ```json and ``` or just find JSON object
    const jsonMatch =
      cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
      cleanedResponse.match(/```\s*([\s\S]*?)\s*```/) ||
      cleanedResponse.match(/(\{[\s\S]*\})/);

    if (jsonMatch && jsonMatch[1]) {
      cleanedResponse = jsonMatch[1].trim();
    }

    // Try to parse as JSON
    const parsed = JSON.parse(cleanedResponse);

    // Validate that it's an object with expected structure
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        error: {
          code: AI_VISION_ERROR_CODES.INVALID_RESPONSE,
          message: 'Response is not a valid object',
          details: { response: cleanedResponse },
        },
      };
    }

    // Extract and validate fields
    const fields: RomanianIDFields = {
      nume: extractStringField(parsed, 'nume'),
      cnp: extractAndValidateCNP(parsed.cnp),
      data_nasterii: extractAndValidateDate(parsed.data_nasterii),
      locul_nasterii: extractStringField(parsed, 'locul_nasterii'),
      domiciliul: extractStringField(parsed, 'domiciliul'),
      seria_si_numarul: extractStringField(parsed, 'seria_si_numarul'),
      data_eliberarii: extractAndValidateDate(parsed.data_eliberarii),
      eliberat_de: extractStringField(parsed, 'eliberat_de'),
      valabil_pana_la: extractAndValidateDate(parsed.valabil_pana_la),
    };

    return {
      success: true,
      fields,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: AI_VISION_ERROR_CODES.INVALID_RESPONSE,
        message: 'Failed to parse model response as JSON',
        details: {
          error:
            error instanceof Error ? error.message : 'Unknown parsing error',
          response: response.substring(0, 500), // First 500 chars for debugging
        },
      },
    };
  }
}

/**
 * Extracts and validates a string field
 */
function extractStringField(obj: any, fieldName: string): string | null {
  const value = obj[fieldName];
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).trim() || null;
}

/**
 * Extracts and validates CNP (Personal Numeric Code)
 */
function extractAndValidateCNP(cnp: any): string | null {
  if (!cnp) return null;

  const cnpStr = String(cnp).replace(/\s/g, ''); // Remove spaces

  // CNP should be exactly 13 digits
  if (!/^\d{13}$/.test(cnpStr)) {
    return null;
  }

  return cnpStr;
}

/**
 * Extracts and validates date fields
 */
function extractAndValidateDate(date: any): string | null {
  if (!date) return null;

  const dateStr = String(date).trim();

  // Check for DD.MM.YYYY format
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    return null;
  }

  // Basic date validation with proper type checking
  const dateParts = dateStr.split('.').map(Number);
  if (dateParts.length !== 3) {
    return null;
  }

  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];

  // Explicit type and range validation
  if (
    typeof day !== 'number' ||
    isNaN(day) ||
    typeof month !== 'number' ||
    isNaN(month) ||
    typeof year !== 'number' ||
    isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }

  return dateStr;
}

/**
 * Calculates confidence scores for each field
 */
function calculateFieldConfidence(
  fields: RomanianIDFields,
  _rawResponse: string
): Record<keyof RomanianIDFields, FieldConfidence> {
  const confidence: Record<keyof RomanianIDFields, FieldConfidence> = {} as any;

  Object.keys(fields).forEach(key => {
    const fieldKey = key as keyof RomanianIDFields;
    const value = fields[fieldKey];

    if (value === null) {
      confidence[fieldKey] = {
        score: 0,
        level: 'low',
        reason: 'Field not detected or unclear',
      };
    } else {
      // Calculate confidence based on field type and content
      let score = 0.7; // Base confidence
      let reason = 'Field detected';

      // Higher confidence for structured fields
      if (fieldKey === 'cnp' && /^\d{13}$/.test(value)) {
        score = 0.95;
        reason = 'Valid CNP format detected';
      } else if (
        fieldKey.includes('data_') &&
        /^\d{2}\.\d{2}\.\d{4}$/.test(value)
      ) {
        score = 0.9;
        reason = 'Valid date format detected';
      } else if (value.length > 10) {
        score = 0.8;
        reason = 'Substantial text content detected';
      }

      confidence[fieldKey] = {
        score,
        level: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
        reason,
      };
    }
  });

  return confidence;
}

/**
 * Calculates overall confidence score
 */
function calculateOverallConfidence(fields: RomanianIDFields): FieldConfidence {
  const values = Object.values(fields);
  const nonNullValues = values.filter(v => v !== null);

  if (nonNullValues.length === 0) {
    return {
      score: 0,
      level: 'low',
      reason: 'No fields detected',
    };
  }

  const detectionRate = nonNullValues.length / values.length;
  let score = detectionRate * 0.8; // Base score from detection rate

  // Bonus for critical fields
  if (fields.nume && fields.cnp) {
    score += 0.1;
  }

  score = Math.min(score, 1.0);

  return {
    score,
    level: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
    reason: `Detected ${nonNullValues.length}/${values.length} fields`,
  };
}

/**
 * Assesses image quality from model response
 */
function assessImageQualityFromResponse(
  response: string
): 'excellent' | 'good' | 'fair' | 'poor' {
  const lowerResponse = response.toLowerCase();

  if (
    lowerResponse.includes('clear') ||
    lowerResponse.includes('high quality')
  ) {
    return 'excellent';
  } else if (
    lowerResponse.includes('readable') ||
    lowerResponse.includes('good')
  ) {
    return 'good';
  } else if (
    lowerResponse.includes('unclear') ||
    lowerResponse.includes('blurry')
  ) {
    return 'poor';
  }

  return 'fair';
}

/**
 * Extracts warnings from model response
 */
function extractWarnings(response: string): string[] {
  const warnings: string[] = [];
  const lowerResponse = response.toLowerCase();

  if (lowerResponse.includes('unclear') || lowerResponse.includes('blurry')) {
    warnings.push('Image quality may affect accuracy');
  }

  if (lowerResponse.includes('damaged') || lowerResponse.includes('torn')) {
    warnings.push('Document appears damaged');
  }

  if (lowerResponse.includes('partial') || lowerResponse.includes('cut off')) {
    warnings.push('Document may be partially visible');
  }

  return warnings;
}

/**
 * Tests the Qwen model with a simple prompt
 */
export async function testQwenModel(): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  performance?: {
    response_time: number;
  };
}> {
  try {
    const startTime = Date.now();

    const response = await ollamaClient.generate({
      prompt:
        'Respond with "Qwen2.5-VL model is working correctly for Romanian ID processing" to confirm functionality.',
      options: {
        temperature: 0.1,
        max_tokens: 100,
      },
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      response: response.response,
      performance: {
        response_time: responseTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
