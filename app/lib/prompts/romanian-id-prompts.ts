/**
 * Romanian ID Field Extraction Prompts for Qwen2.5-VL-7B-Instruct
 * Optimized prompt templates for accurate Romanian ID document processing
 */

import type { RomanianIDFields } from '@/lib/types/romanian-id-types';

// Prompt template types
export interface PromptTemplate {
  /** Template name for identification */
  name: string;
  /** Template description */
  description: string;
  /** The actual prompt text */
  template: string;
  /** Recommended temperature setting */
  temperature: number;
  /** Recommended max tokens */
  maxTokens: number;
  /** Use cases for this template */
  useCases: string[];
}

export interface PromptContext {
  /** Image quality assessment */
  imageQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  /** Detected language hints */
  languageHints?: string[];
  /** Previous extraction attempts */
  previousAttempts?: number;
  /** Specific fields to focus on */
  focusFields?: (keyof RomanianIDFields)[];
  /** Custom instructions */
  customInstructions?: string;
}

/**
 * Base prompt template optimized for Qwen2.5-VL-7B-Instruct
 * Uses advanced instruction-following techniques and structured output
 */
export const BASE_ROMANIAN_ID_PROMPT: PromptTemplate = {
  name: 'base_romanian_id',
  description:
    'Standard Romanian ID extraction with comprehensive field coverage',
  temperature: 0.1,
  maxTokens: 2048,
  useCases: [
    'standard_extraction',
    'good_quality_images',
    'complete_documents',
  ],
  template: `You are an expert Romanian document analyst specializing in Carte de Identitate (Romanian ID cards). Your task is to extract information with maximum accuracy while handling Romanian language specifics.

DOCUMENT ANALYSIS PROTOCOL:
1. Examine the entire document systematically from top to bottom
2. Identify Romanian text patterns and diacritical marks (ă, â, î, ș, ț)
3. Distinguish between printed text and handwritten annotations
4. Validate field formats according to Romanian standards
5. Handle partial visibility or damage gracefully

REQUIRED FIELDS EXTRACTION:
Extract these exact fields with precise formatting:

• nume: Full name (Nume) - Usually in UPPERCASE, may contain diacritics, may contain hyphen, may contain multiple words
• prenume: Full surname (Prenume) - Usually in UPPERCASE, may contain diacritics, may contain hyphen, may contain multiple words
• cnp: Personal Numeric Code - Exactly 13 digits, no spaces or separators
• data_nasterii: Birth date - Format: DD.MM.YYYY (e.g., 15.03.1985)
• locul_nasterii: Birth place - City/locality name, may include county
• domiciliul: Address - Complete address including street, number, city
• seria_si_numarul: ID series and number - Format: XX 123456 (letters + space + digits)
• data_eliberarii: Issue date - Format: DD.MM.YYYY
• eliberat_de: Issuing authority - Usually starts with "SPCLEP" or similar
• valabil_pana_la: Expiry date - Format: DD.MM.YYYY

ROMANIAN LANGUAGE HANDLING:
- Preserve all diacritical marks: ă, â, î, ș, ț
- Handle both uppercase and lowercase variations
- Recognize common Romanian abbreviations (STR., NR., BL., AP., etc.)
- Account for regional naming conventions

QUALITY ASSURANCE:
- If text is unclear or damaged, use null for that field
- Maintain consistent date formatting (DD.MM.YYYY)
- Ensure CNP contains exactly 13 digits
- Preserve original text casing and diacritics

OUTPUT FORMAT:
Return ONLY a valid JSON object with the exact field names. No additional text or explanations.

Example output:
{
  "nume": "POPESCU",
  "prenume": "MARIA ELENA",
  "cnp": "2850315123456",
  "data_nasterii": "15.03.1985",
  "locul_nasterii": "BUCUREȘTI",
  "domiciliul": "STR. VICTORIEI NR. 25, BL. A1, AP. 15, BUCUREȘTI",
  "seria_si_numarul": "RX 123456",
  "data_eliberarii": "20.06.2020",
  "eliberat_de": "SPCLEP BUCUREȘTI",
  "valabil_pana_la": "20.06.2030"
}

Begin analysis of the Romanian ID document:`,
};

/**
 * High-precision prompt for excellent quality images
 * Uses detailed instructions for maximum accuracy
 */
export const HIGH_PRECISION_PROMPT: PromptTemplate = {
  name: 'high_precision',
  description: 'Maximum accuracy extraction for high-quality images',
  temperature: 0.05,
  maxTokens: 2048,
  useCases: ['excellent_quality', 'critical_accuracy', 'validation_required'],
  template: `You are a certified Romanian document verification specialist with expertise in Carte de Identitate analysis. This is a high-precision extraction requiring maximum accuracy.

ENHANCED ANALYSIS PROTOCOL:
1. Perform systematic character-by-character reading
2. Cross-validate extracted information for consistency
3. Apply Romanian document format validation rules
4. Verify date logic and CNP structure
5. Ensure diacritical mark preservation

FIELD-SPECIFIC EXTRACTION RULES:

NUME (Full Name):
- Extract complete name as printed (usually UPPERCASE)
- Preserve all Romanian diacritics (ă, â, î, ș, ț)
- Include all name components
- Handle compound names with hyphens

PRENUME (Full Surname):
- Extract complete surname as printed (usually UPPERCASE)
- Preserve all Romanian diacritics (ă, â, î, ș, ț)
- Include all surname components
- Handle compound surnames with hyphens

CNP (Personal Numeric Code):
- Must be exactly 13 consecutive digits
- First digit indicates gender and century (1-2: male 1900-1999, 5-6: male 2000-2099, etc.)
- Validate against birth date if visible
- No spaces, dashes, or other separators

DATES (data_nasterii, data_eliberarii, valabil_pana_la):
- Strict DD.MM.YYYY format
- Validate day (01-31), month (01-12), year ranges
- Cross-check birth date with CNP if possible
- Ensure logical date relationships (issue < expiry)

ADDRESSES (domiciliul):
- Complete address including all components
- Preserve Romanian address abbreviations (STR., NR., BL., AP., SC., ET.)
- Include locality and postal information if present
- Maintain original formatting and diacritics

SERIA (ID Series):
- Extract only the letter part of the ID series
- Usually 2 uppercase letters representing county code
- Example: "RX" (from "RX 123456")
- Preserve exact case (usually uppercase)

NUMĂRUL (ID Number):
- Extract only the numeric part of the ID number
- Exactly 6 digits
- Example: "123456" (from "RX 123456")
- No spaces or separators

ISSUING AUTHORITY (eliberat_de):
- Complete authority name (usually SPCLEP + location)
- Preserve official abbreviations and formatting
- Include full location specification

VALIDATION CHECKS:
- Ensure all dates use DD.MM.YYYY format
- Verify CNP is exactly 13 digits
- Check date logic (birth < issue < expiry)
- Validate Romanian text encoding

Return ONLY the JSON object with extracted data. Use null for any field that cannot be read with high confidence.

{
  "nume": null,
  "prenume": null,
  "cnp": null,
  "data_nasterii": null,
  "locul_nasterii": null,
  "domiciliul": null,
  "seria": null,
  "numar": null,
  "data_eliberarii": null,
  "eliberat_de": null,
  "valabil_pana_la": null
}

Analyze the Romanian ID document with maximum precision:`,
};

/**
 * Robust prompt for poor quality or damaged images
 * Focuses on extracting what's clearly visible
 */
export const ROBUST_EXTRACTION_PROMPT: PromptTemplate = {
  name: 'robust_extraction',
  description: 'Extraction optimized for poor quality or damaged documents',
  temperature: 0.15,
  maxTokens: 1536,
  useCases: ['poor_quality', 'damaged_documents', 'partial_visibility'],
  template: `You are analyzing a Romanian ID document that may have quality issues, damage, or partial visibility. Focus on extracting only clearly readable information.

ADAPTIVE ANALYSIS APPROACH:
1. Identify the clearest, most readable sections first
2. Work with partial information when complete data isn't available
3. Use context clues to validate uncertain text
4. Prioritize critical fields (nume, cnp) over secondary information
5. Apply Romanian language patterns to resolve ambiguous characters

QUALITY-ADAPTIVE EXTRACTION:

For UNCLEAR TEXT:
- Use null rather than guessing
- Don't interpolate missing characters
- Focus on what is definitively readable
- Consider Romanian character patterns (ă vs a, ș vs s, etc.)

For PARTIAL VISIBILITY:
- Extract complete visible fields only
- Don't attempt to complete cut-off text
- Use context from visible parts to validate format

For DAMAGED AREAS:
- Skip damaged sections entirely
- Focus on undamaged portions
- Validate extracted data against Romanian standards

ROMANIAN TEXT RECOVERY:
- Common character confusions: ă↔a, â↔a, î↔i, ș↔s, ț↔t
- Typical Romanian names and places for context
- Standard address abbreviations (STR., NR., BL., AP.)
- Official authority naming patterns (SPCLEP + location)

FIELD PRIORITIZATION (in order of importance):
1. nume (name) - Most critical for identification
2. prenume (surname) - Most critical for identification
3. cnp (personal code) - Unique identifier
4. data_nasterii (birth date) - Core demographic data
5. seria (ID letters) - Document identifier
6. numar (ID numbers) - Document identifier
7. Other fields as clearly visible

FORMAT VALIDATION:
- Dates: DD.MM.YYYY (use null if format unclear)
- CNP: Exactly 13 digits (use null if incomplete)
- Series: Two letters, no space, no signs (preserve visible format)
- Number: Six numbers, no space, no signs (preserve visible format)

Be conservative with extraction - it's better to return null than incorrect data.

Return JSON with only confidently extracted fields:

{
  "nume": null,
  "prenume": null,
  "cnp": null,
  "data_nasterii": null,
  "locul_nasterii": null,
  "domiciliul": null,
  "seria": null,
  "numar": null,
  "data_eliberarii": null,
  "eliberat_de": null,
  "valabil_pana_la": null
}

Analyze the document and extract only clearly readable information:`,
};

/**
 * Focused prompt for specific field extraction
 * Used when targeting particular fields for re-extraction
 */
export const FOCUSED_FIELD_PROMPT: PromptTemplate = {
  name: 'focused_field',
  description: 'Targeted extraction for specific fields',
  temperature: 0.08,
  maxTokens: 1024,
  useCases: ['field_retry', 'partial_extraction', 'validation_check'],
  template: `You are performing focused extraction on specific fields of a Romanian ID document. Pay special attention to the requested fields while maintaining accuracy.

FOCUSED ANALYSIS INSTRUCTIONS:
1. Concentrate on the specified target fields
2. Apply field-specific validation rules
3. Use enhanced pattern recognition for target areas
4. Cross-validate with document structure knowledge
5. Maintain Romanian language accuracy

TARGET FIELD ANALYSIS:
{FOCUS_FIELDS_PLACEHOLDER}

ROMANIAN LANGUAGE PRECISION:
- Exact diacritical mark preservation (ă, â, î, ș, ț)
- Proper case handling (names usually UPPERCASE)
- Address abbreviation recognition
- Authority name standardization

FIELD-SPECIFIC VALIDATION:
- CNP: Exactly 13 digits, validate against birth date
- Dates: DD.MM.YYYY format, logical relationships
- Names: Complete extraction with diacritics
- Addresses: Full address with proper abbreviations
- Series: Correct letters format with no spacing
- Number: Correct numbers format with no spacing

Return JSON with all fields (use null for non-target fields if not clearly visible):

{
  "nume": null,
  "prenume": null,
  "cnp": null,
  "data_nasterii": null,
  "locul_nasterii": null,
  "domiciliul": null,
  "seria": null,
  "numar": null,
  "data_eliberarii": null,
  "eliberat_de": null,
  "valabil_pana_la": null
}

Focus on the target fields and extract with maximum accuracy:`,
};

/**
 * Multi-shot prompt with examples for better pattern recognition
 * Uses few-shot learning to improve extraction accuracy
 */
export const MULTI_SHOT_PROMPT: PromptTemplate = {
  name: 'multi_shot',
  description: 'Few-shot learning prompt with Romanian ID examples',
  temperature: 0.1,
  maxTokens: 3072,
  useCases: ['pattern_learning', 'complex_layouts', 'improved_accuracy'],
  template: `You are an expert Romanian ID document analyst. Learn from these examples to understand the document structure and extraction patterns.

EXAMPLE 1 - Standard Romanian ID:
Document shows:
- Name: "IONESCU"
- Surname: "ALEXANDRA MARIA"
- CNP: "2950123456789"
- Birth date: "12.01.1995"
- Birth place: "CLUJ-NAPOCA"
- Address: "STR. MIHAI VITEAZU NR. 15, BL. C2, AP. 23, CLUJ-NAPOCA"
- Series: "CJ"
- Number: "123456"
- Issue date: "15.06.2020"
- Authority: "SPCLEP CLUJ"
- Expiry: "15.06.2030"

Correct extraction:
{
  "nume": "IONESCU",
  "prenume": "ALEXANDRA MARIA",
  "cnp": "2950123456789",
  "data_nasterii": "12.01.1995",
  "locul_nasterii": "CLUJ-NAPOCA",
  "domiciliul": "STR. MIHAI VITEAZU NR. 15, BL. C2, AP. 23, CLUJ-NAPOCA",
  "seria": "CJ",
  "numar": "123456",
  "data_eliberarii": "15.06.2020",
  "eliberat_de": "SPCLEP CLUJ",
  "valabil_pana_la": "15.06.2030"
}

EXAMPLE 2 - Romanian ID with diacritics:
Document shows:
- Name: "POPESCU"
- Surname: "ȘTEFAN CĂTĂLIN"
- CNP: "1850315123456"
- Birth date: "15.03.1985"
- Birth place: "BRAȘOV"
- Address: "STR. REPUBLICII NR. 45, BRAȘOV"
- Series: "BV"
- Number: "789012"
- Issue date: "10.09.2019"
- Authority: "SPCLEP BRAȘOV"
- Expiry: "10.09.2029"

Correct extraction:
{
  "nume": "POPESCU",
  "prenume": "ȘTEFAN CĂTĂLIN",
  "cnp": "1850315123456",
  "data_nasterii": "15.03.1985",
  "locul_nasterii": "BRAȘOV",
  "domiciliul": "STR. REPUBLICII NR. 45, BRAȘOV",
  "seria": "BV",
  "numar": "789012",
  "data_eliberarii": "10.09.2019",
  "eliberat_de": "SPCLEP BRAȘOV",
  "valabil_pana_la": "10.09.2029"
}

KEY PATTERNS LEARNED:
1. Names and surnames are in UPPERCASE with preserved diacritics
2. CNP is always 13 consecutive digits
3. Dates follow DD.MM.YYYY format strictly
4. Addresses use standard abbreviations (STR., NR., BL., AP.)
5. Series is the 2-letter in UPPRCASE
6. Number is always 6 digits
7. Authority follows "SPCLEP [Location]" pattern
8. Romanian diacritics (ă, â, î, ș, ț) must be preserved exactly

ANALYSIS PROTOCOL:
1. Apply learned patterns to the new document
2. Maintain exact formatting from examples
3. Preserve all Romanian diacritical marks
4. Use null for unclear or missing fields
5. Validate extracted data against learned patterns

Now analyze the provided Romanian ID document using these learned patterns.

Return ONLY the JSON object with extracted data:

{
  "nume": null,
  "prenume": null,
  "cnp": null,
  "data_nasterii": null,
  "locul_nasterii": null,
  "domiciliul": null,
  "seria": null,
  "numar": null,
  "data_eliberarii": null,
  "eliberat_de": null,
  "valabil_pana_la": null
}

Extract information following the learned patterns:`,
};

/**
 * All available prompt templates
 */
export const PROMPT_TEMPLATES = {
  base: BASE_ROMANIAN_ID_PROMPT,
  high_precision: HIGH_PRECISION_PROMPT,
  robust: ROBUST_EXTRACTION_PROMPT,
  focused: FOCUSED_FIELD_PROMPT,
  multi_shot: MULTI_SHOT_PROMPT,
  // Task-specific aliases
  standard_extraction: BASE_ROMANIAN_ID_PROMPT,
  enhanced_precision: HIGH_PRECISION_PROMPT,
  robust_extraction: ROBUST_EXTRACTION_PROMPT,
  fast_extraction: FOCUSED_FIELD_PROMPT,
  adaptive_extraction: MULTI_SHOT_PROMPT,
} as const;

export type PromptTemplateKey = keyof typeof PROMPT_TEMPLATES;

/**
 * Get the optimal prompt template based on context
 */
export function getOptimalPrompt(context: PromptContext): PromptTemplate {
  // High precision for excellent quality images
  if (context.imageQuality === 'excellent') {
    return PROMPT_TEMPLATES.high_precision;
  }

  // Robust extraction for poor quality
  if (context.imageQuality === 'poor') {
    return PROMPT_TEMPLATES.robust;
  }

  // Focused extraction when targeting specific fields
  if (context.focusFields && context.focusFields.length > 0) {
    return PROMPT_TEMPLATES.focused;
  }

  // Multi-shot for complex cases or retries
  if (context.previousAttempts && context.previousAttempts > 0) {
    return PROMPT_TEMPLATES.multi_shot;
  }

  // Default to base template
  return PROMPT_TEMPLATES.base;
}

/**
 * Build a customized prompt with context-specific instructions
 */
export function buildContextualPrompt(
  template: PromptTemplate,
  context: PromptContext
): string {
  let prompt = template.template;

  // Replace focus fields placeholder for focused extraction
  if (template.name === 'focused_field' && context.focusFields) {
    const focusInstructions = context.focusFields
      .map(field => `- ${field}: Pay special attention to this field`)
      .join('\n');
    prompt = prompt.replace('{FOCUS_FIELDS_PLACEHOLDER}', focusInstructions);
  }

  // Add custom instructions if provided
  if (context.customInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${context.customInstructions}`;
  }

  // Add quality-specific hints
  if (context.imageQuality) {
    const qualityHints = getQualitySpecificHints(context.imageQuality);
    prompt += `\n\nIMAGE QUALITY CONTEXT: ${qualityHints}`;
  }

  return prompt;
}

/**
 * Get quality-specific extraction hints
 */
function getQualitySpecificHints(quality: string): string {
  switch (quality) {
    case 'excellent':
      return 'Image is high quality - extract all visible details with maximum precision.';
    case 'good':
      return 'Image is good quality - standard extraction protocols apply.';
    case 'fair':
      return 'Image has some quality issues - focus on clearly readable text.';
    case 'poor':
      return 'Image quality is poor - extract only confidently readable information.';
    default:
      return 'Apply standard extraction protocols.';
  }
}

/**
 * Generate prompt variations for A/B testing and optimization
 */
export function generatePromptVariations(
  baseTemplate: PromptTemplate,
  context: PromptContext
): PromptTemplate[] {
  const variations: PromptTemplate[] = [baseTemplate];

  // Temperature variations
  variations.push({
    ...baseTemplate,
    name: `${baseTemplate.name}_low_temp`,
    temperature: Math.max(0.01, baseTemplate.temperature - 0.05),
    description: `${baseTemplate.description} (Lower temperature)`,
  });

  variations.push({
    ...baseTemplate,
    name: `${baseTemplate.name}_high_temp`,
    temperature: Math.min(0.3, baseTemplate.temperature + 0.05),
    description: `${baseTemplate.description} (Higher temperature)`,
  });

  // Context-specific variations
  if (context.imageQuality === 'poor') {
    variations.push({
      ...baseTemplate,
      name: `${baseTemplate.name}_poor_quality`,
      template:
        baseTemplate.template +
        '\n\nNOTE: This image appears to have quality issues. Focus on clearly readable text only.',
      description: `${baseTemplate.description} (Poor quality adaptation)`,
    });
  }

  if (context.focusFields && context.focusFields.length > 0) {
    const focusFieldsStr = context.focusFields.join(', ');
    variations.push({
      ...baseTemplate,
      name: `${baseTemplate.name}_focused`,
      template:
        baseTemplate.template +
        `\n\nPRIORITY FIELDS: Pay special attention to: ${focusFieldsStr}`,
      description: `${baseTemplate.description} (Field-focused)`,
    });
  }

  return variations;
}

/**
 * Create a dynamic prompt based on extraction history and performance
 */
export function createAdaptivePrompt(
  extractionHistory: Array<{
    template: string;
    success: boolean;
    confidence: number;
    errors: string[];
  }>,
  context: PromptContext
): PromptTemplate {
  // Analyze common failure patterns
  const commonErrors = extractionHistory
    .filter(h => !h.success || h.confidence < 0.7)
    .flatMap(h => h.errors);

  const errorFrequency: Record<string, number> = {};
  commonErrors.forEach(error => {
    errorFrequency[error] = (errorFrequency[error] || 0) + 1;
  });

  // Get base template
  const baseTemplate = getOptimalPrompt(context);

  // Add adaptive instructions based on common errors
  let adaptiveInstructions = '';

  if (errorFrequency['CNP validation failed']) {
    adaptiveInstructions +=
      '\n\nCNP FOCUS: Pay extra attention to the 13-digit personal numeric code. Ensure no spaces or separators.';
  }

  if (errorFrequency['Date format incorrect']) {
    adaptiveInstructions +=
      '\n\nDATE FOCUS: Strictly use DD.MM.YYYY format for all dates. Double-check day/month order.';
  }

  if (errorFrequency['Missing diacritics']) {
    adaptiveInstructions +=
      '\n\nDIACRITICS FOCUS: Carefully preserve Romanian diacritics (ă, â, î, ș, ț) in names and places.';
  }

  return {
    ...baseTemplate,
    name: 'adaptive_prompt',
    description: 'Dynamically adapted prompt based on extraction history',
    template: baseTemplate.template + adaptiveInstructions,
  };
}

/**
 * Get prompt template by specific name
 */
export function getPromptTemplate(name: PromptTemplateKey): PromptTemplate {
  return PROMPT_TEMPLATES[name];
}

/**
 * List all available prompt templates
 */
export function listAvailableTemplates(): Array<{
  key: PromptTemplateKey;
  template: PromptTemplate;
}> {
  return Object.entries(PROMPT_TEMPLATES).map(([key, template]) => ({
    key: key as PromptTemplateKey,
    template,
  }));
}
