/**
 * Prompt Validation and Testing System
 * Evaluates prompt effectiveness and provides optimization recommendations
 */

import type { RomanianIDFields } from '@/lib/types/romanian-id-types';
import type { PromptContext } from './romanian-id-prompts';
import {
  validateField,
  normalizeField,
  crossValidateFields,
} from './field-extraction-patterns';
import { calculateRomanianConfidence } from './romanian-language-support';

// Validation result types
export interface PromptValidationResult {
  /** Overall validation score (0-1) */
  score: number;
  /** Field-specific validation results */
  fieldResults: Record<keyof RomanianIDFields, FieldValidationResult>;
  /** Cross-field validation results */
  crossValidation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  /** Performance metrics */
  performance: {
    extractionAccuracy: number;
    formatCompliance: number;
    languageAccuracy: number;
    completeness: number;
  };
  /** Recommendations for improvement */
  recommendations: string[];
  /** Confidence assessment */
  confidence: {
    overall: number;
    byField: Record<keyof RomanianIDFields, number>;
  };
}

export interface FieldValidationResult {
  /** Field name */
  field: keyof RomanianIDFields;
  /** Extracted value */
  value: string | null;
  /** Is the value valid according to field rules */
  isValid: boolean;
  /** Normalized value */
  normalizedValue: string | null;
  /** Confidence score for this field */
  confidence: number;
  /** Field-specific errors */
  errors: string[];
  /** Field-specific warnings */
  warnings: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

export interface PromptTestCase {
  /** Test case name */
  name: string;
  /** Test description */
  description: string;
  /** Expected extraction results */
  expected: RomanianIDFields;
  /** Image quality simulation */
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  /** Test scenario type */
  scenario: 'standard' | 'damaged' | 'partial' | 'complex' | 'edge_case';
  /** Additional context for testing */
  context?: PromptContext;
}

/**
 * Validate extracted Romanian ID fields against expected results
 */
export function validateExtraction(
  extracted: Partial<RomanianIDFields>,
  expected?: Partial<RomanianIDFields>
): PromptValidationResult {
  const fieldResults: Record<keyof RomanianIDFields, FieldValidationResult> =
    {} as any;
  const recommendations: string[] = [];

  // Validate each field
  const fieldNames: (keyof RomanianIDFields)[] = [
    'nume',
    'prenume',
    'cnp',
    'data_nasterii',
    'locul_nasterii',
    'domiciliul',
    'seria_si_numarul',
    'data_eliberarii',
    'eliberat_de',
    'valabil_pana_la',
  ];

  fieldNames.forEach(field => {
    const extractedValue = extracted[field] ?? null;
    const expectedValue = expected?.[field] ?? null;
    fieldResults[field] = validateSingleField(
      field,
      extractedValue,
      expectedValue
    );
  });

  // Cross-field validation
  const crossValidation = crossValidateFields(extracted);

  // Calculate performance metrics
  const performance = calculatePerformanceMetrics(fieldResults, expected);

  // Calculate confidence scores
  const confidence = calculateConfidenceScores(fieldResults, extracted);

  // Generate recommendations
  recommendations.push(
    ...generateRecommendations(fieldResults, crossValidation, performance)
  );

  // Calculate overall score
  const score = calculateOverallScore(
    performance,
    confidence.overall,
    crossValidation.isValid
  );

  return {
    score,
    fieldResults,
    crossValidation,
    performance,
    recommendations,
    confidence,
  };
}

/**
 * Validate a single field
 */
function validateSingleField(
  field: keyof RomanianIDFields,
  extracted: string | null,
  expected?: string | null
): FieldValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic validation
  const isValid = validateField(field, extracted);
  if (!isValid && extracted) {
    errors.push(`Invalid format for field ${field}`);
  }

  // Normalize the value
  const normalizedValue = extracted ? normalizeField(field, extracted) : null;

  // Calculate confidence based on field type
  const fieldType = getFieldType(field);
  const confidence = extracted
    ? calculateRomanianConfidence(extracted, fieldType)
    : 0;

  // Compare with expected value if provided
  if (expected !== undefined) {
    if (extracted !== expected) {
      if (normalizedValue === expected) {
        warnings.push(
          `Value needs normalization: "${extracted}" → "${expected}"`
        );
      } else {
        errors.push(`Expected "${expected}", got "${extracted}"`);
        if (expected) {
          suggestions.push(`Consider: "${expected}"`);
        }
      }
    }
  }

  // Field-specific validation
  addFieldSpecificValidation(field, extracted, errors, warnings, suggestions);

  return {
    field,
    value: extracted,
    isValid: errors.length === 0,
    normalizedValue,
    confidence,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Get field type for Romanian language processing
 */
function getFieldType(
  field: keyof RomanianIDFields
): 'surname' | 'given_name' | 'address' | 'city' | 'authority' | 'general' {
  switch (field) {
    case 'nume':
      return 'surname';
    case 'prenume':
      return 'given_name';
    case 'domiciliul':
      return 'address';
    case 'locul_nasterii':
      return 'city';
    case 'eliberat_de':
      return 'authority';
    default:
      return 'general';
  }
}

/**
 * Add field-specific validation rules
 */
function addFieldSpecificValidation(
  field: keyof RomanianIDFields,
  value: string | null,
  errors: string[],
  warnings: string[],
  _suggestions: string[]
): void {
  if (!value) return;

  switch (field) {
    case 'cnp':
      if (!/^\d{13}$/.test(value)) {
        errors.push('CNP must be exactly 13 digits');
      }
      break;

    case 'data_nasterii':
    case 'data_eliberarii':
    case 'valabil_pana_la':
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        errors.push('Date must be in DD.MM.YYYY format');
      }
      break;

    case 'seria_si_numarul':
      if (!/^[A-Z]{1,3}\s\d{6}$/.test(value)) {
        errors.push('Series must be in format: XX 123456');
      }
      break;

    case 'nume':
      if (value.length < 2) {
        errors.push('Name too short');
      }
      if (!/^[A-ZĂÂÎȘȚ\s\-']+$/.test(value)) {
        warnings.push('Name contains unexpected characters');
      }
      break;

    case 'prenume':
      if (value.length < 2) {
        errors.push('Given name too short');
      }
      if (!/^[A-ZĂÂÎȘȚ\s\-']+$/.test(value)) {
        warnings.push('Given name contains unexpected characters');
      }
      break;

    case 'eliberat_de':
      if (!value.includes('SPCLEP') && !value.includes('EVIDENTA')) {
        warnings.push('Authority name may be incomplete');
      }
      break;
  }
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(
  fieldResults: Record<keyof RomanianIDFields, FieldValidationResult>,
  expected?: Partial<RomanianIDFields>
): {
  extractionAccuracy: number;
  formatCompliance: number;
  languageAccuracy: number;
  completeness: number;
} {
  const fields = Object.values(fieldResults);
  const totalFields = fields.length;

  // Extraction accuracy (how many fields match expected values)
  let accurateFields = 0;
  if (expected) {
    fields.forEach(result => {
      const expectedValue = expected[result.field];
      if (expectedValue !== undefined && result.value === expectedValue) {
        accurateFields++;
      }
    });
  }
  const extractionAccuracy = expected ? accurateFields / totalFields : 0;

  // Format compliance (how many fields pass validation)
  const validFields = fields.filter(result => result.isValid).length;
  const formatCompliance = validFields / totalFields;

  // Language accuracy (average Romanian language confidence)
  const languageScores = fields
    .filter(result => result.value !== null)
    .map(result => result.confidence);
  const languageAccuracy =
    languageScores.length > 0
      ? languageScores.reduce((sum, score) => sum + score, 0) /
        languageScores.length
      : 0;

  // Completeness (how many fields have values)
  const extractedFields = fields.filter(result => result.value !== null).length;
  const completeness = extractedFields / totalFields;

  return {
    extractionAccuracy,
    formatCompliance,
    languageAccuracy,
    completeness,
  };
}

/**
 * Calculate confidence scores
 */
function calculateConfidenceScores(
  fieldResults: Record<keyof RomanianIDFields, FieldValidationResult>,
  _extracted: Partial<RomanianIDFields>
): {
  overall: number;
  byField: Record<keyof RomanianIDFields, number>;
} {
  const byField: Record<keyof RomanianIDFields, number> = {} as any;
  const confidenceScores: number[] = [];

  Object.entries(fieldResults).forEach(([field, result]) => {
    byField[field as keyof RomanianIDFields] = result.confidence;
    if (result.value !== null) {
      confidenceScores.push(result.confidence);
    }
  });

  const overall =
    confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length
      : 0;

  return { overall, byField };
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(
  fieldResults: Record<keyof RomanianIDFields, FieldValidationResult>,
  crossValidation: { isValid: boolean; errors: string[]; warnings: string[] },
  performance: {
    extractionAccuracy: number;
    formatCompliance: number;
    languageAccuracy: number;
    completeness: number;
  }
): string[] {
  const recommendations: string[] = [];

  // Performance-based recommendations
  if (performance.completeness < 0.7) {
    recommendations.push(
      'Consider using a more robust prompt template for better field extraction'
    );
  }

  if (performance.formatCompliance < 0.8) {
    recommendations.push(
      'Add more specific format validation instructions to the prompt'
    );
  }

  if (performance.languageAccuracy < 0.8) {
    recommendations.push(
      'Enhance Romanian language processing with better diacritic handling'
    );
  }

  // Field-specific recommendations
  Object.values(fieldResults).forEach(result => {
    if (result.errors.length > 0) {
      recommendations.push(`Fix ${result.field}: ${result.errors[0]}`);
    }

    if (result.confidence < 0.6) {
      recommendations.push(
        `Improve ${result.field} extraction with field-specific prompting`
      );
    }
  });

  // Cross-validation recommendations
  if (!crossValidation.isValid) {
    recommendations.push(
      'Address cross-field validation errors for data consistency'
    );
  }

  crossValidation.warnings.forEach(warning => {
    recommendations.push(`Warning: ${warning}`);
  });

  return recommendations;
}

/**
 * Calculate overall validation score
 */
function calculateOverallScore(
  performance: {
    extractionAccuracy: number;
    formatCompliance: number;
    languageAccuracy: number;
    completeness: number;
  },
  confidence: number,
  crossValidationValid: boolean
): number {
  // Weighted average of different metrics
  const weights = {
    extractionAccuracy: 0.3,
    formatCompliance: 0.25,
    languageAccuracy: 0.2,
    completeness: 0.15,
    confidence: 0.1,
  };

  let score =
    performance.extractionAccuracy * weights.extractionAccuracy +
    performance.formatCompliance * weights.formatCompliance +
    performance.languageAccuracy * weights.languageAccuracy +
    performance.completeness * weights.completeness +
    confidence * weights.confidence;

  // Penalty for cross-validation failures
  if (!crossValidationValid) {
    score *= 0.8;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Create test cases for prompt validation
 */
export function createTestCases(): PromptTestCase[] {
  return [
    {
      name: 'Standard Romanian ID',
      description: 'High-quality image with all fields clearly visible',
      imageQuality: 'excellent',
      scenario: 'standard',
      expected: {
        nume: 'POPESCU',
        prenume: 'MARIA ELENA',
        cnp: '2850315123456',
        data_nasterii: '15.03.1985',
        locul_nasterii: 'BUCUREȘTI',
        domiciliul: 'STR. VICTORIEI NR. 25, BL. A1, AP. 15, BUCUREȘTI',
        seria_si_numarul: 'RX 123456',
        data_eliberarii: '20.06.2020',
        eliberat_de: 'SPCLEP BUCUREȘTI',
        valabil_pana_la: '20.06.2030',
      },
    },
    {
      name: 'Romanian ID with Diacritics',
      description: 'Document with Romanian diacritical marks',
      imageQuality: 'good',
      scenario: 'standard',
      expected: {
        nume: 'IONESCU',
        prenume: 'ȘTEFAN CĂTĂLIN',
        cnp: '1850315123456',
        data_nasterii: '15.03.1985',
        locul_nasterii: 'BRAȘOV',
        domiciliul: 'STR. REPUBLICII NR. 45, BRAȘOV',
        seria_si_numarul: 'BV 789012',
        data_eliberarii: '10.09.2019',
        eliberat_de: 'SPCLEP BRAȘOV',
        valabil_pana_la: '10.09.2029',
      },
    },
    {
      name: 'Poor Quality Image',
      description: 'Low quality scan with some unclear text',
      imageQuality: 'poor',
      scenario: 'damaged',
      expected: {
        nume: 'GHEORGHE',
        prenume: 'ALEXANDRA',
        cnp: '2920512123456',
        data_nasterii: '12.05.1992',
        locul_nasterii: 'CLUJ-NAPOCA',
        domiciliul: null, // Assume address is unclear
        seria_si_numarul: 'CJ 345678',
        data_eliberarii: '15.08.2021',
        eliberat_de: 'SPCLEP CLUJ',
        valabil_pana_la: '15.08.2031',
      },
    },
    {
      name: 'Partial Document',
      description: 'Document with some fields cut off or missing',
      imageQuality: 'fair',
      scenario: 'partial',
      expected: {
        nume: 'MUNTEANU',
        prenume: 'IOANA CRISTINA',
        cnp: '2851201123456',
        data_nasterii: '01.12.1985',
        locul_nasterii: 'TIMIȘOARA',
        domiciliul: 'STR. MIHAI VITEAZU NR. 10, TIMIȘOARA',
        seria_si_numarul: null, // Assume series is cut off
        data_eliberarii: null,
        eliberat_de: null,
        valabil_pana_la: null,
      },
    },
    {
      name: 'Complex Address',
      description: 'Document with complex multi-line address',
      imageQuality: 'good',
      scenario: 'complex',
      expected: {
        nume: 'VASILE',
        prenume: 'CONSTANTIN MARIAN',
        cnp: '1750820123456',
        data_nasterii: '20.08.1975',
        locul_nasterii: 'CONSTANȚA',
        domiciliul:
          'STR. DOROBANȚILOR NR. 15, BL. C2, SC. A, ET. 3, AP. 12, CONSTANȚA',
        seria_si_numarul: 'CT 567890',
        data_eliberarii: '05.04.2022',
        eliberat_de: 'SPCLEP CONSTANȚA',
        valabil_pana_la: '05.04.2032',
      },
    },
  ];
}

/**
 * Run prompt validation tests
 */
export function runPromptTests(
  extractionFunction: (
    _testCase: PromptTestCase
  ) => Promise<Partial<RomanianIDFields>>,
  testCases: PromptTestCase[] = createTestCases()
): Promise<{
  overallScore: number;
  testResults: Array<{
    testCase: PromptTestCase;
    validation: PromptValidationResult;
  }>;
  summary: {
    passedTests: number;
    totalTests: number;
    averageScore: number;
    commonIssues: string[];
  };
}> {
  return Promise.all(
    testCases.map(async testCase => {
      const extracted = await extractionFunction(testCase);
      const validation = validateExtraction(extracted, testCase.expected);

      return {
        testCase,
        validation,
      };
    })
  ).then(testResults => {
    const scores = testResults.map(result => result.validation.score);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const passedTests = testResults.filter(
      result => result.validation.score >= 0.8
    ).length;

    // Collect common issues
    const allRecommendations = testResults.flatMap(
      result => result.validation.recommendations
    );
    const issueFrequency: Record<string, number> = {};
    allRecommendations.forEach(rec => {
      issueFrequency[rec] = (issueFrequency[rec] || 0) + 1;
    });

    const commonIssues = Object.entries(issueFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      overallScore: averageScore,
      testResults,
      summary: {
        passedTests,
        totalTests: testCases.length,
        averageScore,
        commonIssues,
      },
    };
  });
}
