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
import {
  extractBirthDateFromCNP,
  extractGenderFromCNP,
  validateCNPConsistency,
  validateDateConsistency,
  validateCNP,
  validateRomanianIDData,
} from '@/lib/utils/cnp-utils';

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
 * Fix common confusion between address and ID number fields
 */
function fixAddressIdNumberConfusion(fields: any, warnings: string[]): void {
  if (!fields.numar || !fields.domiciliul) return;

  // If ID number contains letters or is clearly not a 6-digit number, it might be part of the address
  if (!/^\d{6}$/.test(fields.numar)) {
    // Store the potentially confused values
    const originalNumar = fields.numar;
    const originalAddress = fields.domiciliul;

    // Try to extract a valid ID number from the address if it contains digit patterns
    const addressDigits = originalAddress.match(/\b\d{6}\b/g);

    if (addressDigits && addressDigits.length > 0) {
      // Found a 6-digit number in the address - this might be the real ID number
      const potentialNumar = addressDigits[0];

      // Update the values and log the change
      fields.numar = potentialNumar;

      // Add original value to address if it looks like it belongs there
      if (
        /[A-Za-z]/.test(originalNumar) ||
        /Jud|Com|Sat|Str/i.test(originalNumar)
      ) {
        // Combine the original "numar" with the address if it appears to be part of the address
        fields.domiciliul = `${originalAddress} ${originalNumar}`;
      }

      warnings.push(
        `Possible confusion between ID number and address detected. Updated ID number from "${originalNumar}" to "${potentialNumar}".`
      );
    } else {
      // Try to extract just the digits from the ID number field
      const numarDigits = originalNumar.replace(/\D/g, '');

      if (numarDigits.length === 6) {
        fields.numar = numarDigits;
        warnings.push(
          `ID number "${originalNumar}" contained non-digits. Corrected to "${numarDigits}".`
        );
      } else {
        warnings.push(
          `ID number "${originalNumar}" is invalid. It should be 6 digits only.`
        );
      }
    }
  }
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

  // Ensure metadata object exists
  if (!data.metadata) {
    data.metadata = {};
  }

  // Ensure warnings array exists
  if (!data.metadata.warnings) {
    data.metadata.warnings = [];
  }

  // Fix common extraction confusions
  fixAddressIdNumberConfusion(data.fields, data.metadata.warnings);

  // Validate ID number - must be exactly 6 digits
  if (data.fields.numar && !/^\d{6}$/.test(data.fields.numar)) {
    data.metadata.warnings.push(
      `Invalid ID number format: ${data.fields.numar}. Must be exactly 6 digits with no letters.`
    );

    // Try to fix common issues with ID number
    const digitsOnly = data.fields.numar.replace(/\D/g, '');
    if (digitsOnly.length === 6) {
      data.fields.numar = digitsOnly;
      data.metadata.warnings.push(
        `Fixed ID number by removing non-digit characters: ${data.fields.numar}`
      );
    } else {
      data.metadata.warnings.push(
        `Could not automatically fix ID number: ${data.fields.numar}. It may be confused with another field.`
      );
    }
  }

  // Validate series - must be only letters
  if (data.fields.seria && !/^[A-Z]{1,3}$/.test(data.fields.seria)) {
    data.metadata.warnings.push(
      `Invalid series format: ${data.fields.seria}. Must be 1-3 uppercase letters only.`
    );
  }

  // Birth date must ALWAYS be extracted from CNP, as it's not visible on Romanian ID cards
  if (data.fields.cnp) {
    const extractedDate = extractBirthDateFromCNP(data.fields.cnp);
    if (extractedDate) {
      // If the model provided a birth date, verify it matches what CNP encodes
      if (
        data.fields.data_nasterii &&
        data.fields.data_nasterii !== extractedDate
      ) {
        data.metadata.warnings.push(
          `Provided birth date (${data.fields.data_nasterii}) doesn't match CNP-encoded date (${extractedDate}). Using CNP-derived date.`
        );
      }

      // Always use the CNP-derived birth date
      data.fields.data_nasterii = extractedDate;
    } else {
      data.metadata.warnings.push(
        `Could not extract birth date from CNP: ${data.fields.cnp}. CNP may be invalid.`
      );
    }
  } else if (data.fields.data_nasterii) {
    // If we have a birth date but no CNP, warn that this is unusual
    data.metadata.warnings.push(
      'Birth date provided but no CNP found. Birth date should be derived from CNP.'
    );
  }

  // Validate sex against CNP if both are present
  if (data.fields.cnp && data.fields.sex) {
    const extractedSex = extractGenderFromCNP(data.fields.cnp);
    if (extractedSex && data.fields.sex !== extractedSex) {
      // Sex field must match CNP's encoded sex
      data.metadata.warnings.push(
        `Sex field (${data.fields.sex}) doesn't match CNP-encoded gender (${extractedSex}). This is inconsistent.`
      );
    }
  } else if (!data.fields.sex && data.fields.cnp) {
    // Extract sex from CNP if not provided
    const extractedSex = extractGenderFromCNP(data.fields.cnp);
    if (extractedSex) {
      data.fields.sex = extractedSex;
    }
  }

  // Validate expiry date against birth date from CNP
  if (data.fields.cnp && data.fields.valabil_pana_la) {
    const birthDate = extractBirthDateFromCNP(data.fields.cnp);
    if (birthDate) {
      const birthParts = birthDate.split('.');
      const expiryParts = data.fields.valabil_pana_la.split('.');

      if (birthParts.length === 3 && expiryParts.length === 3) {
        const birthDay = birthParts[0];
        const birthMonth = birthParts[1];
        const expiryDay = expiryParts[0];
        const expiryMonth = expiryParts[1];

        if (birthDay !== expiryDay || birthMonth !== expiryMonth) {
          data.metadata.warnings.push(
            `Expiry date day/month (${expiryDay}.${expiryMonth}) doesn't match birth date day/month (${birthDay}.${birthMonth}) from CNP. ID cards expire on the holder's birth day.`
          );
        }
      }
    }
  }

  // Validate CNP using the official Romanian algorithm
  if (data.fields.cnp && !validateCNP(data.fields.cnp)) {
    data.metadata.warnings.push(
      `CNP validation failed: ${data.fields.cnp}. The CNP appears to be invalid according to the official algorithm.`
    );
  }

  // Validate consistency between CNP, birth date and sex
  if (data.fields.cnp) {
    const { isValid, errors } = validateCNPConsistency(
      data.fields.cnp,
      data.fields.data_nasterii,
      data.fields.sex
    );

    if (!isValid && errors.length > 0) {
      data.metadata.warnings.push(...errors);
    }
  }

  // Validate consistency between dates
  if (
    data.fields.data_nasterii &&
    data.fields.data_eliberarii &&
    data.fields.valabil_pana_la
  ) {
    const { isValid, errors } = validateDateConsistency(
      data.fields.data_nasterii,
      data.fields.data_eliberarii,
      data.fields.valabil_pana_la
    );

    if (!isValid && errors.length > 0) {
      data.metadata.warnings.push(...errors);
    }
  }

  // If the model returned seria and numar but not seria_si_numarul, combine them
  if (data.fields.seria && data.fields.numar && !data.fields.seria_si_numarul) {
    data.fields.seria_si_numarul = `${data.fields.seria} ${data.fields.numar}`;
  }

  // Perform comprehensive validation
  const validationResult = validateRomanianIDData({
    cnp: data.fields.cnp,
    data_nasterii: data.fields.data_nasterii,
    sex: data.fields.sex,
    data_eliberarii: data.fields.data_eliberarii,
    valabil_pana_la: data.fields.valabil_pana_la,
    seria: data.fields.seria,
    numar: data.fields.numar,
  });

  // Add validation errors and warnings to metadata
  if (validationResult.errors.length > 0) {
    data.metadata.warnings.push(...validationResult.errors);
  }

  if (validationResult.warnings.length > 0) {
    data.metadata.warnings.push(...validationResult.warnings);
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
    '6 DIGITS ONLY',
    'FULL ADDRESS INCLUDING ALL LINES',
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
6. Pay careful attention to ID card number format - it MUST be 6 digits without letters
7. Ensure address is extracted completely, including all lines shown

IMPORTANT: The birth date (data nașterii) is NOT present as a visible field on Romanian ID cards. It must ALWAYS be derived from CNP.

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
- Contains encoded information about birth date and sex:
  * First digit: 1=Male born 1900-1999, 2=Female born 1900-1999, 5=Male born 2000+, 6=Female born 2000+
  * Next 6 digits: Birth date in YYMMDD format
  * The CNP must be validated according to the official algorithm (check digit)
  * The first digit of CNP must be consistent with the sex field

NATIONALITATE (Nationality):
- Format: Usually "ROMÂNĂ / ROU" or other nationality in uppercase
- Extract only the first part before slash ("ROMÂNĂ")
- Common locations: Near the "CETĂȚENIE:" or "CETĂȚENIE" label on the ID
- Example: "ROMÂNĂ" (DO NOT USE THIS VALUE - extract the actual nationality)

SEX (Gender):
- Format: Single letter "M" or "F"
- Common locations: Near the "SEX:" or "SEX" label on the ID
- Example: "M" for male, "F" for female
- This MUST be consistent with the first digit of the CNP (odd=male, even=female)

DATA NAȘTERII (Birth Date):
- NOT visibly present on the Romanian ID card
- Must be extracted from the CNP (digits 2-7 in YYMMDD format)
- Must be in DD.MM.YYYY format in the output
- Always derive this field from the CNP, not from visual inspection of the card

LOCUL NAȘTERII (Birth Place):
- Usually a city or locality name
- May include county or region
- Common locations: Near the "LOCUL NAȘTERII:" label on the ID

DOMICILIUL (Address):
- Complete residential address, including ALL LINES
- May include street, number, block, apartment, city, county
- Often spans over MULTIPLE LINES
- Common locations: Near the "DOMICILIUL:" label on the ID
- IMPORTANT: Extract the ENTIRE address - all parts, all lines

SERIA (ID Series):
- Format: Letters only (usually 2 letters)
- Common locations: Near the "SERIA" label on the ID
- Examples: "XX", "AB", "CJ" (DO NOT USE THESE VALUES - extract the actual series)
- SHOULD NOT contain digits

NUMĂRUL (ID Number):
- Format: MUST BE EXACTLY 6 DIGITS with no spaces
- Common locations: Near the "NR." label on the ID
- Example: "123456" (DO NOT USE THIS VALUE - extract the actual number)
- MUST ONLY CONTAIN DIGITS - no letters
- ALWAYS extract 6 digits, no more, no less
- If it appears to have letters or fewer than 6 digits, you are likely misreading it

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
- Romanian IDs are typically valid for 10 years from issue date
- The day and month of the expiry date MUST match the day and month of the birth date (extracted from CNP)
- The year of the expiry date is typically 10 years after the issue date

ROMANIAN ID CARD LAYOUT:
- Top section: ROMÂNIA, EU stars, etc.
- Middle left: Photo and signature
- Middle right: Personal information (name, CNP, birth)
- Bottom section: Address, series/number, dates, authority

CNP VALIDATION AND RELATIONSHIPS:
- The CNP must be validated using the official Romanian check digit algorithm
- The CNP encodes birth date in positions 2-7 (YYMMDD format)
- The CNP's first digit encodes gender (odd=male, even=female)
- ID cards expire on the holder's birth day and month, 10 years after issuance
- The birth date is NOT visible on the card and must be derived from CNP

OUTPUT FORMAT:
YOU MUST RETURN ONLY JSON. NO TEXT BEFORE OR AFTER THE JSON. Return exactly this structure:

{
  "fields": {
    "nume": "[EXTRACTED SURNAME ONLY]",
    "prenume": "[EXTRACTED GIVEN NAME(S) ONLY]",
    "cnp": "[13 DIGITS WITH NO SPACES]",
    "nationalitate": "[NATIONALITY, FIRST WORD ONLY]",
    "sex": "[M OR F]",
    "data_nasterii": "[DD.MM.YYYY FORMAT - EXTRACTED FROM CNP]",
    "locul_nasterii": "[EXTRACTED PLACE]",
    "domiciliul": "[FULL ADDRESS INCLUDING ALL LINES]",
    "seria": "[SERIES LETTERS ONLY]",
    "numar": "[6 DIGITS ONLY]",
    "data_eliberarii": "[DD.MM.YYYY FORMAT]",
    "valabil_pana_la": "[DD.MM.YYYY FORMAT]",
    "eliberat_de": "[ISSUING AUTHORITY]"
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
5. The address (domiciliul) may split into multiple lines, extract the FULL address including ALL LINES
6. DO NOT make up information - if you can't see it, use null
7. Always preserve Romanian diacritics in text
8. If no ID document is visible, set all fields to null and explain in overall_confidence
9. For nationality, if format is "X / Y", extract only X (first part before slash)
10. For sex, extract only "M" or "F" and ensure it matches the CNP's first digit
11. For data_nasterii, ALWAYS extract it from the CNP - it is NOT visible on the card
12. For valabil_pana_la, verify day and month match birth date from CNP
13. For numar (ID number), MUST EXTRACT EXACTLY 6 DIGITS - not 5, not 7, and NO LETTERS
14. DO NOT USE PLACEHOLDER TEXT OR EXAMPLES - extract only the real data from the image
15. RESPOND ONLY WITH JSON - NO EXPLANATIONS BEFORE OR AFTER THE JSON`;
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
              nationalitate: null,
              sex: null,
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
              nationalitate: null,
              sex: null,
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
